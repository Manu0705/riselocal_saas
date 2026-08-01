# RiseLocal SaaS — Complete Architectural Audit Report

**Audit date:** 2026-08-01  
**Repository:** `riselocal_saas` (monorepo)  
**Base revision audited:** `d8818dc` (`master`)  
**Scope:** Entire repository; special focus on last ~15 commits  
**Method:** Static evidence only (schema, migrations, source, git history, build logs). No production database introspection was available; live-DB state is therefore inferred where noted.

---

## 1. Executive Summary

RiseLocal is a multi-tenant SaaS monorepo (Next.js web + Express API + Prisma/PostgreSQL + admin app) intended for production on Vercel + Render + Neon. Folder layout suggests Domain-Driven Design, but runtime behavior is a hybrid of partial DDD, direct Prisma access, and raw SQL.

**Primary root cause is not a single UI bug.** It is **cross-layer synchronization failure**, originating in **broken Prisma migration history that has never matched `schema.prisma`**, then amplified by **duplicate / divergent contracts** (lead statuses, tenant theme/customization, Feedback shape) between database, ORM, API, `domain-core`, web, and admin.

Symptoms that appear in the UI (tenant 404s during outages, admin analytics stuck at zero, themes/hours not applying, booking UX clearing on failure) are **downstream**. The architectural source is: schema/migration drift + absent shared contract enforcement + ignored typechecking in frontend builds.

**Highest-leverage stabilization fix:** squash/rebuild the migration chain to match the current Prisma schema (including `Tenant.slug`, `FollowUp`, restored `Lead.phone`, and current `Feedback` columns), then publish one shared contract package for `LeadStatus` and `TenantPublicPayload` and force both frontends + API to consume it.

The older `ARCHITECTURE_AUDIT.md` (2026-03-08) incorrectly concludes the system is production-ready with working Redis/BullMQ and no violations. Current evidence contradicts that document.

---

## 2. Repository Architecture Overview

### 2.1 Topology

```
apps/
  api/          Express 5 REST API (no own package.json; deps in root)
  web/          Next.js 14.2.3 App Router (tenant storefront + tenant dashboard)
  admin/        Next.js 14.2.3 App Router (platform admin)
packages/
  database/     Prisma 5.22 schema, migrations, client
  domain-core/  Partial domain aggregates + tenant.contract.ts
  cache/        Redis stub (commented out; unused)
  queue/        BullMQ stub (placeholder; unused)
  ui/           Placeholder components (no package.json; unused)
services/
  worker/jobs/  TODO placeholders (not in pnpm workspace)
```

### 2.2 Stack inventory

| Concern | Technology | Evidence |
|---|---|---|
| Monorepo | pnpm workspaces (`apps/*`, `packages/*`) | `pnpm-workspace.yaml` |
| API | Express 5.2, Helmet, CORS, Morgan | `package.json`, `apps/api/src/server.ts` |
| ORM / DB | Prisma 5.22 + PostgreSQL | `packages/database/prisma/schema.prisma` |
| Web / Admin | Next.js 14 App Router, React 18, Tailwind | `apps/web`, `apps/admin` |
| Auth | JWT (1h), scrypt passwords; admin via env password | `apps/api/src/modules/auth` |
| Storage | Cloudinary uploads | `apps/api/src/modules/upload` |
| Cache (intended) | Redis via `@saas/cache` | **stub only** — `packages/cache/src/redis.ts` |
| Cache (actual) | Process-local `Map`, 60s TTL for public tenant | `public-tenant-cache.ts` |
| Queue / jobs | BullMQ / worker jobs | **stubs only** |
| Deploy | Vercel (web), Render (API), Neon (DB) | `README.md`, `render.yaml` |
| Validation | No Zod/Joi; manual checks | package manifests |
| Tests | None found | no `*.test.ts` / `*.spec.ts`; no CI workflows |
| CI/CD | Render buildCommand runs migrate deploy; no GitHub Actions CI | `.github/` has agent md only |

### 2.3 Runtime configuration

**API required:** `DATABASE_URL`, `JWT_SECRET`, Cloudinary trio, `ADMIN_PASSWORD` (≥12 chars).  
**API optional:** `APP_ENV`, `PORT`, `FRONTEND_URL`.  
**Web:** `NEXT_PUBLIC_API_URL` (default injected in `next.config.js` to `https://api.riselocal.in`).  
**Gap:** `ADMIN_PASSWORD` is mandatory at API startup (`server.ts`) but **absent from `render.yaml`**. Fresh Render deploy fails unless set manually in the dashboard.

### 2.4 Historical vs current architecture claim

| Claim in `ARCHITECTURE_AUDIT.md` | Current evidence |
|---|---|
| Complete DDD separation | Lead uses raw SQL lifecycle service; gallery/settings/content use Prisma directly |
| Redis/BullMQ operational | Stubs / commented code |
| Admin is placeholder | Admin now has tenants/themes/users/leads/analytics |
| Production-ready / no violations | Migration history irreconcilable; builds skip typecheck; contract drift |

---

## 3. Dependency Graph

```
PostgreSQL
    ↓
Prisma schema / client  (@saas/database)
    ↓
┌───────────────────────────────────────────────┐
│ Repositories (partial)                        │
│  - PrismaTenantRepository                     │
│  - PrismaFeedbackRepository                   │
│  - PrismaLeadRepository (largely superseded)  │
│ Direct Prisma in gallery/settings/content     │
│ LeadLifecycleService (parameterized raw SQL)  │
└───────────────────────────────────────────────┘
    ↓
Services / use cases (partial, inconsistent)
    ↓
Controllers / route modules (Express)
    ↓
HTTP JSON API  (/api/*)
    ↓
┌──────────────────┬────────────────────────────┐
│ apps/web         │ apps/admin                 │
│ - BFF proxy      │ - Direct fetch to API      │
│ - api-client     │ - adminApi                 │
│ - tenant-client  │                            │
│ - getTenant      │                            │
└──────────────────┴────────────────────────────┘
    ↓
React Context + local useState (no React Query/Zustand)
    ↓
UI (themes, dashboard, admin tables)
```

**Ownership summary**

| Entity | Owner of truth | Who writes | Who validates | Sync points |
|---|---|---|---|---|
| Tenant | DB `Tenant` + `TenantSettings` | Admin/API tenant routes | Manual string checks | Public cache Map; web `getTenant` |
| Theme | Dual: `Tenant.theme` column **and** `TenantSettings.sectionOrder.themeKey` JSON | Tenant/settings routes write JSON primarily | `normalizeTenantThemeKey` (duplicated) | Public response prefers JSON |
| Lead | DB `Lead` (+ sessions/activities/bookings) | `LeadLifecycleService` | Manual + E.164 normalize | Web maps statuses; admin does not |
| FollowUp | DB table expected by raw SQL | Lifecycle service INSERT | Date parse only | **No migration creates table** |
| Feedback | DB `Feedback` via Prisma repo | Feedback use case / controller | Entity factory | **Migration history leaves incompatible columns** |
| Gallery/Services/Social | Dedicated tables | Direct Prisma routes | Minimal | Public tenant projection |

---

## 4. Data Flow Diagram

### 4.1 Public tenant storefront

```
Browser → middleware (subdomain/path slug)
       → TenantLayout.getTenant(slug)
       → (SSR) GET upstream /api/tenants/slug/:slug
            → public-tenant-cache?
            → prisma.tenant.findUnique({ settings, gallery, services, social })
            → build customization from settings.sectionOrder JSON
            → omit openHour/closeHour/availableHours from customization/settings projection
       → ResolvedTenant flatten (reads settings compatibility object)
       → ThemeRenderer → theme component → booking/CTA capture
            → POST /api/public/tenant/:slug/leads/upsert
            → LeadLifecycleService.upsertLead (phone unique per tenant)
```

### 4.2 Tenant dashboard

```
Login → POST /api/auth/login → JWT in localStorage
DashboardDataProvider → Promise.allSettled(
  resolveTenant, leads, analytics, feedback, settings
)
Lead mutations → PATCH status/followup/assign via tenant-scoped routes
```

### 4.3 Admin

```
Password-only UI → POST /api/auth/admin-login (env ADMIN_PASSWORD)
→ JWT admin_token
→ CRUD tenants / tenant-users / list leads for metrics
```

---

## 5. Database Audit

**Source of truth inspected:** `packages/database/prisma/schema.prisma` (13 models, no Prisma enums).

### 5.1 Current intended schema (ORM)

- `Tenant`: required unique `slug`; nullable unique `domain`; `theme` default `"default"`
- `TenantUser`: roles as free strings (`owner`/`manager`/`staff`); unique `(tenantId, email)`
- `Lead`: required `phone`; unique `(tenantId, phone)`; status/source as strings; soft delete
- Lifecycle tables: `LeadSession`, `LeadActivity`, `Booking`
- `GoogleReviewSummary` 1:1
- `Feedback`: `comment`, `leadId`, `type`, `rating`, `status`, `approvedBy`, `createdBy`
- `FollowUp`: note + optional `followUpAt`
- Customization: `TenantSettings`, `GalleryImage`, `SocialLink`, `Service`

### 5.2 Findings

| Finding | Severity | Evidence |
|---|---|---|
| `Tenant.slug` never created by any migration SQL | **Critical** | All migration SQLs lack `slug`; schema requires it since initial commit `f55fb8a` |
| `FollowUp` table never created by migrations | **Critical** | No `CREATE TABLE "FollowUp"`; lifecycle service inserts into `"FollowUp"` |
| Migration `20260303040411_` drops `Lead.phone`/`source`/`deletedAt` | **Critical** | Explicit DROP in that migration |
| Later lifecycle migration indexes/uses `Lead.phone` without re-adding it | **Critical** | `20260318120000_lead_lifecycle_engine` |
| Feedback columns irreversibly mutated then never restored | **Critical** | Drop `comment`/`leadId`/`type`; add `message`; schema/code still use `comment`+`leadId` |
| Dual theme storage (`Tenant.theme` vs JSON `themeKey`) | High | Schema + `tenant.routes.ts` / `tenant-settings.routes.ts` |
| `fontFamily` / actionButtons / galleryCategories / leadLifecycle stored in JSON blob `sectionOrder` | High | Runtime extractors; Prisma default is still a string array |
| `Feedback` / `FollowUp` relations lack `onDelete` cascade | Medium | schema.prisma |
| Redundant indexes on unique `tenantId` FKs | Low | TenantSettings, GoogleReviewSummary |
| No Prisma enums for statuses/roles (stringly typed) | Medium | Allows silent vocabulary drift across layers |

### 5.3 Normalization / dead concepts

- Historical tables dropped in migrations (`User`, `LeadActivityLog`, `WhatsAppClick`) while domain still evolves elsewhere.
- `domain-core` lead aggregate still models `WON`/`LOST` and required email — dead relative to runtime API (`CONVERTED`/`CLOSED`, phone-required).

**Inference (stated as uncertainty):** Production Neon databases were likely shaped via `prisma db push` or manual SQL at some point, which is why a live system can run while `migrate deploy` from a clean database cannot. Confidence in live-DB exact state: **low** without `prisma migrate status` against prod.

---

## 6. Migration Audit

### 6.1 Chronological chain

1. `20260301102237_init` — enums + Tenant(no slug)/User/Lead/Feedback/activity/WhatsApp
2. `20260303040411_` — destructive rewrite: drops phone/source; Feedback→message; drops User tables/enums; makes domain NOT NULL
3. `20260309120000_add_tenant_user` — creates `TenantUser`
4. `20260309130000_add_tenant_customization` — TenantSettings/gallery/social/service
5. `20260318120000_lead_lifecycle_engine` — assumes `Lead.phone` exists; creates session/activity/booking
6. `20260411000000_add_theme_booking_google_review` — Tenant.theme, Booking metadata, GoogleReviewSummary
7. `20260412183000_add_missing_tenant_settings` — hours columns + opportunistic `Lead.source` patch

### 6.2 Irreconcilability proof

Fresh `prisma migrate deploy` must fail (or produce a DB that cannot satisfy Prisma Client) because:

1. After step 2, `Lead.phone` is gone.
2. Step 5 creates indexes on `"phone"` and partitions by `"phone"`.
3. No step creates `Tenant.slug` or `FollowUp`.
4. No step restores Feedback to `{comment, leadId, type, rating, status, approvedBy}`.
5. Step 7’s `ADD COLUMN IF NOT EXISTS "source"` is itself evidence operators already knew drift existed.

### 6.3 Architectural drift start point

**Drift began at the initial commit (`f55fb8a`, 2026-03-09):** `schema.prisma` already required `slug`/`FollowUp`/current Feedback shape while the bundled migration SQL described a different, older (and then further broken) database.

**Drift accelerated at `3a1cce0` (lead lifecycle):** schema + raw SQL advanced without repairing the migration foundation.

**Recent band-aid:** `16e88d1` added missing hours/`source` via `IF NOT EXISTS` rather than reconciling history.

---

## 7. API Contract Audit

### 7.1 Surface

~63 Express route registrations under `/api` plus `GET /health`. Auth: JWT Bearer (prefix not strictly validated). Admin role middleware for tenant admin routes. Public lead/feedback capture under `/api/public/tenant/:tenantSlug/...`.

Documented `API_ENDPOINTS.md` is a **subset** of real routes (missing admin-login, tenant-users, settings, gallery, upload, public upsert, followup/assign/activity, etc.).

### 7.2 Contract mismatches (backend vs consumers)

| Area | Backend reality | Consumer expectation | Impact |
|---|---|---|---|
| Lead status vocabulary | `NEW\|CONTACTED\|QUALIFIED\|CONVERTED\|CLOSED` | Admin: `Open\|Follow-Up\|Converted\|Lost` (title case) | Admin metrics/filters wrong |
| Lead status (web) | Uppercase API | Web maps via helpers (mostly OK) | Partial; UI labels still title-case |
| Public tenant payload | Has `customization` + extra `settings`; **no `updatedAt`**; hours omitted | `TenantPublicPayload` requires `updatedAt` + hours in customization; web reads `settings` | Hours/theme edge cases |
| Theme source | Prefer JSON `sectionOrder.themeKey`; column often default | Dual inputs `theme`/`themeKey` | Column becomes dead |
| Action buttons | Public normalizer vs settings normalizer differ (`message` vs labels/URLs/`confirmBooking`) | Web editor / public CTA | Saved messages dropped publicly |
| Error bodies | Mix of `{error}`, `{message}`, `{success,message}` | Clients assume various shapes | Fragile error UX |
| Gallery reorder | `PUT /gallery/:id` registered **before** `PUT /gallery/reorder` | Client expects reorder path | Reorder shadowed |
| Auth roles typing | Runtime lowercase multi-role | `auth.types.ts` declares `ADMIN\|USER` | Dead types |
| Health | `/health` process-only; `/api/health` hits DB | Docs only list `/health` | False healthy when DB down |

### 7.3 Validation layer

No schema validation library. Controllers catch broadly and often return HTTP 400 for auth/DB/internal failures, bypassing central `errorHandler` semantics.

---

## 8. Frontend Audit

### 8.1 Web (`apps/web`)

- Next.js 14 App Router; middleware for `*.riselocal.in` / path slugs; **custom domains not resolved**.
- Two overlapping API clients (`api-client`, `tenant-client`) + direct `getTenant` fetch + BFF proxy `app/api/[...path]`.
- State: `AuthContext`, `DashboardDataContext`, local state — no query cache library.
- `getTenant` depends on non-contractual `settings` object, not canonical `customization`.
- `TenantLayout` (`7337931`) catches all `getTenant` errors and calls `notFound()` → **API outages become “Tenant Not Found” 404s**.
- Booking form awaits capture but does not check `success` before clearing fields.
- `next.config.js`: `typescript.ignoreBuildErrors = true`, `eslint.ignoreDuringBuilds = true` — green builds ≠ type-safe.
- Types in `types/lead.ts` / `types/tenant.ts` are obsolete; dashboard uses `any[]` heavily.

### 8.2 Admin (`apps/admin`)

- Direct API calls; no retries/timeouts; no 401 recovery.
- Lead status comparisons use legacy title-case values → open/follow-up/converted counts remain ~0.
- Login UI/docs still reference weak `admin123` while API enforces ≥12-char `ADMIN_PASSWORD`.
- Shared `packages/ui` unused placeholders.

### 8.3 Frontend assumptions vs backend

| Assumption | Backend | Result |
|---|---|---|
| Settings blob includes hours on public GET | Hours omitted from public projection | Defaults / synthetic slots |
| Admin statuses title-case | Uppercase enums | Broken admin analytics |
| Dashboard `tenant.services` populated via `resolveTenant` | Identity-only mapping | “Total Services” ≈ 0 |
| API errors distinguishable from missing tenant | Layout maps both to 404 | Misdiagnosis in ops |

---

## 9. Synchronization Audit

End-to-end mismatches:

| Layer A | Layer B | Mismatch |
|---|---|---|
| `schema.prisma` | Migration SQL | slug, FollowUp, phone, Feedback columns |
| Migration SQL | Runtime raw SQL | FollowUp INSERT; phone unique |
| Prisma Feedback model | Migration Feedback | `comment`/`leadId` vs `message` |
| `domain-core` LeadStatus | API LeadStatus | `WON/LOST` vs `CONVERTED/CLOSED` |
| API LeadStatus | Admin UI | Uppercase vs title-case legacy |
| API LeadStatus | Web UI labels | Mapped, but duplicate mappers |
| `TenantCustomization` | Public GET builder | hours fields omitted |
| `TenantPublicPayload.updatedAt` | Public GET | field absent |
| Theme column | Theme JSON | writes prefer JSON |
| Action button shape | Settings vs public vs web | message/labels/confirmBooking lossy |
| `fontFamily` | TenantSettings columns | only in JSON blob |
| Auth role types | Middleware roles | unused uppercase union |
| Cache package | Runtime cache | Redis unused; Map used |
| Queue package | Workers | both stubs |
| `ARCHITECTURE_AUDIT.md` | Reality | outdated “healthy” claim |

**Classification:** The system’s primary failure mode is **synchronization between layers**, with the **database migration/history layer as the foundational break**, and **contract duplication** as the amplifier that turns DB/API truth into UI lies.

---

## 10. Regression Analysis (last ~15 commits)

Ranked by **likelihood of causing production instability** (1 = highest).

| Rank | Commit | Intent | Actual impact | Hidden side effects | Breaking? | Arch violation | Regression probability |
|---|---|---|---|---|---|---|---|
| 1 | `16e88d1` add missing TenantSettings/Lead columns | Patch schema drift | Confirms migrations out of sync; partial repair only | Encourages `IF NOT EXISTS` culture instead of baseline repair | Soft | Yes — migration hygiene | **High** (deploy/migrate path) |
| 2 | `7337931` TenantLayout error→null | Avoid crash on resolve failure | Converts API/network failures into 404 | Masks outages as “tenant missing” | UX break | Yes — error taxonomy | **High** (symptom severity) |
| 3 | `19eff1b` theme normalization + contracts | Share theme types | Improves keys but public payload still omits hours; dual theme remains | Contract introduced but not enforced end-to-end | Partial | Mild | **Medium-High** |
| 4 | `d80cdf2` theme/booking/google review | Feature expansion | Adds `Tenant.theme` + JSON theme coexistence | Dual source of truth for theme | Additive | Yes — dual write model | **Medium-High** |
| 5 | `d332324` / `cb4e290` TS path refactors | Fix package resolution | Needed for builds; logs show prior TS7016 `@saas/database` | Build logs committed into repo; start path churn | Deploy risk | Process smell | **Medium** |
| 6 | `f0f5bf1` / `268e82d` / `3bf0145` / `d8818dc` start/migrate/prisma dep fixes | Unblock Render | Moving migrate into buildCommand exposes broken history at deploy time | Prod build now depends on irreparable migrate chain | **Yes** if clean DB | Deploy coupling | **Medium** (env-dependent) |
| 7 | `a744555` / `18ea4ac` / `c1ef472` / `f9a5c13` API URL/retry/error UX | Harden client resilience | Helps flaky networks; still no success checks on booking | Timeout+retry semantics inconsistent | No | Mild | **Medium-Low** |
| 8 | `ac165e8` gallery resolver tweak | Gallery mapping fix | Localized | — | No | No | Low |
| 9 | `b106944` theme key fix + giant `trace.txt` | Theme normalize | Noise in repo | Trace dump committed | No | Process | Low |

### Where architectural drift began (beyond last 15)

- **Origin:** `f55fb8a` initial commit — schema ≠ migrations.
- **Major acceleration:** `3a1cce0` lead lifecycle engine (raw SQL + status normalization + FollowUp usage) without migration reconciliation.
- **Theme dual-truth:** `d80cdf2` → `19eff1b`.
- **Symptom masking:** `7337931`.

---

## 11. Root Cause Analysis

### 11.1 Five Whys (production instability)

1. **Why do production issues appear in the UI?**  
   Because UI layers interpret incomplete/incorrect payloads and map transport failures to business 404s.

2. **Why are payloads incomplete/incorrect?**  
   Because API projections and frontends do not share one enforced contract (hours omitted; admin status vocabulary stale; theme dual-sourced).

3. **Why wasn’t the contract enforced?**  
   Because `domain-core` is only partially adopted, frontend builds ignore TypeScript errors, and there are no tests/CI contract checks.

4. **Why can the API and ORM disagree with the database history?**  
   Because migration SQL never matched `schema.prisma`, and later features assumed live DB columns/tables that migrations do not create.

5. **Why did that happen?**  
   Because the project evolved schema via direct schema edits / likely `db push` while retaining an irreconcilable migration chain from day one — i.e., **no single source of truth across Database → ORM → Migrations → API DTOs → Frontend types**.

### 11.2 Causal chain

```
Initial schema/migration divergence (f55fb8a)
  → Live DBs diverge from migrate history (inferred)
    → Feature migrations assume columns that history deleted (3a1cce0)
      → Band-aid IF NOT EXISTS migrations (16e88d1)
        → Deploy pipeline starts running migrate deploy (d8818dc et al.)
          → Fresh/QA environments fragile or inconsistent
            + Contract duplication (statuses/theme/customization)
              → Admin/web mis-render truth
                + Error handling maps outages to 404 (7337931)
                  → Operators see “UI bugs” that are architectural sync failures
```

### 11.3 Primary vs secondary

- **Primary root cause:** Cross-layer synchronization failure anchored in **irreconcilable Prisma migration history vs schema/ORM/runtime SQL**.
- **Secondary contributing causes:**
  1. Absent shared, enforced API/DTO contracts.
  2. Lead status vocabulary drift (especially admin).
  3. Dual theme/customization storage and lossy public projection.
  4. Frontend build typecheck disabled.
  5. Error handling that collapses infrastructure failures into business 404s.
  6. Stubbed cache/queue/workers presented as architecture.
  7. Missing `ADMIN_PASSWORD` in Render blueprint.

---

## 12. Evidence Table

| ID | Issue | Severity | Evidence (files/functions/commits) | Reasoning | Impact | Likelihood | Confidence |
|---|---|---|---|---|---|---|---|
| E1 | `Tenant.slug` missing from all migrations | Critical | migrations/*; schema `Tenant.slug`; since `f55fb8a` | ORM requires column migrations never create | Fresh migrate cannot produce runnable tenant routing DB | High on fresh deploy | **Very high** |
| E2 | `FollowUp` used but never migrated | Critical | `lead-lifecycle.service.ts` `INSERT INTO "FollowUp"`; no migration CREATE | Runtime depends on non-migrated table | Follow-up features fail on migrate-only DBs | High | **Very high** |
| E3 | `Lead.phone` dropped then indexed | Critical | `20260303040411_` DROP; `20260318120000` indexes phone | History self-contradicts | migrate deploy failure / missing identity key | High | **Very high** |
| E4 | Feedback schema vs migrations | Critical | migration drops `comment`/`leadId`; Prisma repo writes `comment`/`leadId`/`rating` | Code cannot match migrate-produced Feedback table | Feedback/review broken on migrate-only DBs | High | **Very high** |
| E5 | Admin lead status mismatch | High | `apps/admin/.../page.tsx` filters `'Open'` etc.; API returns `NEW`… | String equality never matches | Analytics/dashboard counts wrong | Certain in code path | **Very high** |
| E6 | Public hours omitted | High | `tenant.routes.ts` customization builder omits `openHour`/`closeHour`/`availableHours`; settings PUT saves them; `getTenant` reads settings.* | Write path ≠ read path | Booking availability wrong/defaulted | Certain | **Very high** |
| E7 | Outage→404 masking | High | `layout.tsx` try/catch → `notFound()` commit `7337931` | Transport errors treated as missing entity | False tenant-not-found incidents | High when API flaky | **Very high** |
| E8 | Dual theme source | High | `Tenant.theme` column + `sectionOrder.themeKey`; public prefers JSON | Two truths | Theme updates appear ignored if wrong field read | Medium-High | **High** |
| E9 | Gallery reorder shadowed | Medium | `gallery.routes.ts` `PUT /:id` before `PUT /reorder` | Express param route wins | Reorder API broken | Certain | **Very high** |
| E10 | Typecheck skipped on web | Medium | `apps/web/next.config.js` ignoreBuildErrors | Contract drift invisible in CI/build | Regressions ship silently | Certain | **Very high** |
| E11 | No automated tests / CI | High | no test files; no workflow CI | No safety net for sync regressions | Ongoing drift | Certain | **Very high** |
| E12 | ADMIN_PASSWORD not in render.yaml | High | `server.ts` exit(1); render.yaml env list | Deploy blueprint incomplete | API won’t boot without manual secret | High on new service | **Very high** |
| E13 | Redis/BullMQ stubs | Medium | `packages/cache`, `packages/queue`, worker TODOs | Documented architecture fake | Multi-instance cache inconsistency; no jobs | Certain | **Very high** |
| E14 | Booking clears on failed capture | Medium | `booking.tsx` no `result.success` check | Treats soft-fail as success UX | Lost leads + user thinks success | High | **High** |
| E15 | domain-core lead aggregate stale | Medium | `lead.aggregate.ts` WON/LOST; unused by lifecycle | Duplicate domain model | Future contributors implement wrong statuses | Medium | **High** |

---

## 13. Risk Assessment

| Risk | Production impact | Notes |
|---|---|---|
| New environment / DB recreate via migrate deploy | **Severe** | Chain cannot yield current schema |
| Existing prod DB (if db-pushed historically) | Degraded but possibly running | Uncertainty: exact prod schema unknown without live inspect |
| Horizontal scale of API | Cache/rate-limit Maps not shared | Stale tenant branding across instances |
| Security | Admin shared password; JWT 1h no revocation; plaintext admin email hard-coded in client | Elevate carefully |
| Observability | Error shapes inconsistent; 404 masking | MTTR increases |
| Theme/customization edits | Lossy projections | Customer-visible branding bugs |
| Admin reporting | Incorrect funnel metrics | Business decisions on bad numbers |

**Rollback posture:** Feature commits are mixed with deploy-path changes. Rolling back only frontend error handling (`7337931`) is safe; rolling back migrate-in-build without a corrected baseline leaves deploy/runtime inconsistent.

---

## 14. Recovery Roadmap

**Do not rewrite the project.** Repair the source of truth, then align contracts outward.

### Critical blockers (do first)

1. **Inspect live DB** (`prisma migrate status`, `\d` / information_schema) for prod + QA. Record actual columns/tables.
2. **Create a baseline/squash migration** that matches current `schema.prisma` (or replace history with a single `0_baseline` after verifying prod already matches schema). Must include: `Tenant.slug`, `Lead.phone`, current Feedback columns, `FollowUp`, indexes/FKs.
3. **Stop shipping `IF NOT EXISTS` band-aids** as substitutes for history repair.
4. **Add `ADMIN_PASSWORD` to Render env** (blueprint + dashboard). Verify API boot.

### High priority

5. **Publish one shared contract** (`LeadStatus`, `TenantPublicPayload`, action button shape) from `@saas/domain-core` (or new `packages/contracts`) and delete duplicate enums/mappers in admin/web.
6. **Fix public tenant projection** to include `openHour`/`closeHour`/`availableHours` and stop depending on unofficial `settings` blob — or formally document `settings` as the compatibility contract and generate types from it.
7. **Collapse theme to one source of truth** (prefer typed column **or** JSON, not both). Migrate existing JSON themeKey → chosen store.
8. **Revert 404-masking:** distinguish 404 vs 5xx/network in `TenantLayout` / `getTenant`.
9. **Fix admin status filters** to uppercase API vocabulary (or map centrally).
10. **Enable web typecheck** (turn off `ignoreBuildErrors`) and fix resulting errors.

### Medium priority

11. Fix gallery route order (`/reorder` before `/:id`).
12. Booking/CTA: honor `success` before clearing form state; send declared UTM fields.
13. Unify web API clients; standardize error envelope `{success, message, code}`.
14. Make `/health` reflect DB (or keep shallow health but use `/api/health` in Render healthCheckPath).
15. Remove or real-implement Redis cache; if multi-instance, process Map is incorrect.

### Low priority / safe refactors

16. Delete or quarantine stale `domain-core` lead/feedback aggregates until aligned.
17. Remove placeholder `packages/ui` / worker TODOs from “architecture” claims; update docs.
18. Expand `API_ENDPOINTS.md` / Postman to match routes.ts.
19. Add CI: `prisma migrate diff`, `tsc` for api/web/admin, smoke `scripts/test-api.sh`.

### Dangerous refactors (defer)

- Big-bang DDD rewrite of all modules.
- Introducing BullMQ/Redis before contract/schema stability.
- Renaming lead statuses without a data migration + dual-read period.

### Migration risks & dependency order

```
Live DB audit
  → baseline migration / history repair
    → contract package + API projection fixes
      → admin/web consumer alignment
        → enable typecheck/CI
          → cache/queue only after read-path correctness
```

**Breaking changes expected:** public tenant payload shape (if removing `settings` compatibility), admin status labels, possibly theme field names. Require versioned response or dual-publish period.

**Rollback requirements:** keep DB backup before baseline apply; feature-flag public payload changes; avoid irreversible drops until both frontends deployed.

---

## 15. Architecture Health Scorecard

| Area | Score (/10) | Rationale |
|---|---|---|
| Database | 3 | Model intent reasonable; history broken; dual-truth JSON blobs |
| ORM | 5 | Prisma usage competent where used; raw SQL bypasses; models ≠ migrations |
| API | 5 | Broad feature coverage; inconsistent errors/validation; route bugs |
| Business Logic | 5 | Lead lifecycle is substantial; duplicated/partial DDD elsewhere |
| Frontend | 4 | Usable UX; contract drift; ignored TS; error masking |
| Authentication | 4 | JWT works; admin shared secret; no refresh/revocation |
| Authorization | 5 | Tenant isolation + role checks exist; unused guards/types |
| Deployment | 4 | Render/Vercel documented; migrate-on-build + missing ADMIN_PASSWORD |
| Configuration | 4 | No `.env.example`; secrets gaps; QA NODE_ENV=development |
| Maintainability | 3 | Drift, stubs, committed logs/traces, outdated audit docs |
| Scalability | 3 | In-memory cache/rate limits; no workers |
| Code Quality | 4 | Hotspots good; many `any`s; inconsistent layers |
| Test Coverage | 1 | No automated tests found |
| Technical Debt | 3 | High debt concentrated in sync/migrations/contracts |

**Overall system health: ~3.5 / 10** — operable only where live DB was manually aligned; not safely reproducible or evolvable.

---

## 16. Final Verdict

| Question | Answer |
|---|---|
| Is the primary problem in the database? | **Partially — specifically migration history / schema reproducibility**, not necessarily the conceptual model. |
| Is the primary problem in the API? | **Secondary.** API projections and dual theme/settings logic amplify sync failures. |
| Is the primary problem in the frontend? | **Secondary/symptomatic.** Admin status mismatch and 404-masking are real but downstream. |
| Is the primary problem in synchronization between layers? | **Yes — this is the primary architectural failure mode.** |
| Which commit most likely introduced the regression? | **Foundational:** `f55fb8a` (schema≠migrations). **Accelerant:** `3a1cce0`. **Among last ~15:** `16e88d1` (deployable evidence of drift) + `7337931` (symptom amplification). Theme dual-truth: `d80cdf2`/`19eff1b`. |
| Single highest-leverage fix? | **Rebuild/squash Prisma migrations to match current `schema.prisma` (slug, phone, Feedback, FollowUp), verify against live DB, then enforce one shared LeadStatus + TenantPublicPayload contract across API/web/admin.** |

### Bottom line

The system did not “break in the UI.” It **never had a single synchronized source of truth** from database migrations through ORM, API DTOs, and frontend types. Recent commits mostly patched deploy paths and symptoms. Stabilization requires repairing that spine—not another isolated frontend fix.

---

*End of audit. No application code was changed; this document is diagnostic only.*
