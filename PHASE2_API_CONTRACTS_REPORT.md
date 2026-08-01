# Phase 2 — API & Shared Contracts

**Status:** Complete (re-verified after duplicate purge)  
**Branch:** `cursor/phase2-api-shared-contracts-7ca4`  
**Date:** 2026-08-01  
**Depends on:** Phase 1 baseline (`cursor/phase1-database-prisma-7ca4`)

---

## Issue P2-01 — Lead status vocabulary drift

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Evidence** | API: `NEW/CONTACTED/QUALIFIED/CONVERTED/CLOSED`. Admin compared `'Open'/'Follow-Up'/'Converted'/'Lost'`. domain-core aggregate used `WON/LOST`. |
| **Root Cause** | No shared lead status contract; each layer invented strings. |
| **Affected Layers** | domain-core → API lifecycle → admin UI → web dashboard |
| **Fix** | `packages/domain-core/lead.contract.ts` with canonical statuses, aliases, UI labels, transitions. Wired into lifecycle, lead entity, controller, admin pages, web `DashboardDataContext`. |
| **Files** | `lead.contract.ts`, `lead.aggregate.ts`, `lead-lifecycle.service.ts`, `lead.entity.ts`, `lead.controller.ts`, admin dashboard/leads/analytics, `DashboardDataContext.tsx` |
| **Risk** | Admin metrics change from ~0 to correct (intended). |
| **Tests** | `pnpm run test:contracts` |
| **Verification** | `normalizeLeadStatus('Open')==='NEW'`; admin filters use normalize |

---

## Issue P2-02 — Public tenant payload incomplete vs TenantPublicPayload

| Field | Value |
|---|---|
| **Severity** | High |
| **Evidence** | Public GET omitted `updatedAt`, `openHour`, `closeHour`, `availableHours` while settings PUT saved hours. |
| **Root Cause** | Serializer not built from shared contract. |
| **Fix** | Public serializer returns typed `TenantPublicPayload` (ISO dates, customization hours). Stale `settings` compatibility projection removed; web resolver reads `customization`. |
| **Files** | `tenant.routes.ts`, `tenant.contract.ts`, `apps/web/lib/tenant-resolver.ts` |
| **Risk** | Low — additive fields; web resolver updated in lockstep. |
| **Verification** | Code inspection of public tenant builder; `TenantPublicPayload` typed assignment |

---

## Issue P2-03 — Action button field loss between routes

| Field | Value |
|---|---|
| **Severity** | High |
| **Evidence** | Public normalizer kept label/url, dropped message; settings kept phone/message, dropped label/url/confirmBooking. |
| **Root Cause** | Duplicate incompatible normalizers. |
| **Fix** | Single `normalizeActionButtons` in `tenant.contract.ts` used by API + web. Deleted web duplicate implementation; web keeps only `resolveActionHref` helper. |
| **Files** | `tenant.contract.ts`, `tenant.routes.ts`, `tenant-settings.routes.ts`, web public/customize consumers |
| **Risk** | Low — preserves more fields. |

---

## Issue P2-04 — Inconsistent API error envelopes

| Field | Value |
|---|---|
| **Severity** | High |
| **Evidence** | Auth/gallery/settings returned `{ error }`; admin client reads `message` only. |
| **Root Cause** | No shared response helper. |
| **Fix** | `api-response.contract.ts` + `sendError`/`sendSuccess`. Migrated auth, gallery, tenant-settings, content, upload. Global errorHandler already used `{ success:false, message }`. |
| **Files** | `api-response.contract.ts`, `apps/api/src/shared/http/api-response.ts`, auth/gallery/settings/content/upload routes |
| **Remaining** | None for `{ error }` JSON responses in `apps/api/src`. |

---

## Issue P2-05 — Gallery reorder shadowed

| Field | Value |
|---|---|
| **Severity** | High |
| **Evidence** | `PUT /gallery/:id` registered before `PUT /gallery/reorder`. |
| **Fix** | Register `/gallery/reorder` before `/gallery/:id`. |
| **Files** | `gallery.routes.ts` |
| **Verification** | Route order in source: reorder at line ~104, `:id` after |

---

## Issue P2-06 — Auth role type fiction

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Evidence** | `auth.types.ts` declared `ADMIN\|USER`; runtime uses lowercase `owner/manager/staff/admin/super_admin`. |
| **Fix** | `auth.contract.ts`; `auth.types.ts` re-exports; login uses `normalizeAuthRole`; tenant-user uses `TENANT_USER_ROLES`; middleware/controllers use `isAdminRole` / `normalizeAuthRole`. |

---

## Commands that must pass

```bash
pnpm run test:contracts
pnpm --filter @saas/domain-core run build
pnpm exec tsc -p apps/api/tsconfig.json --noEmit
pnpm run db:sync-check   # Phase 1 gate still green
```

## Intentionally deferred

- Full Zod validation on every route (contracts + normalizers first; schema validation can layer on later)
- Collapsing `Tenant.theme` column vs JSON dual storage to one DB column (serializer now prefers JSON themeKey consistently)
- Frontend typecheck enablement (`ignoreBuildErrors`) — Phase 3+
- 404-masking in TenantLayout — Phase 3 frontend

## Source of truth after Phase 2

```
domain-core contracts
  lead.contract / tenant.contract / auth.contract / api-response.contract
        ↓
API services & serializers
        ↓
Admin + Web consumers (status/theme helpers)
```
