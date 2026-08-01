# Phase 1 — Database & Prisma Reconciliation

**Status:** Complete (local verification). Existing prod/QA require operator cutover before deploy.  
**Branch:** `cursor/phase1-database-prisma-7ca4`  
**Date:** 2026-08-01

---

## Issue P1-01 — Migration history cannot reproduce schema.prisma

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Evidence** | Empty Postgres + old chain: `P3018` on `20260318120000_lead_lifecycle_engine` — `column "source" of relation "Lead" does not exist`. Captured in local reproduce before repair. |
| **Root Cause** | `20260303040411_` dropped `Lead.source`/`Lead.phone`; later migrations assumed those columns; `Tenant.slug`, `FollowUp`, current `Feedback` columns never created by any migration. |
| **Affected Layers** | Migration history → ORM → API raw SQL (`FollowUp`) → deploy (`migrate deploy`) |
| **Proposed Fix** | Baseline squash: archive broken migrations; add single `20260801000000_baseline_schema` generated from `schema.prisma`. |
| **Files To Change** | `packages/database/prisma/migrations/**`, `migrations_legacy_archive/**`, `MIGRATION_BASELINE.md` |
| **Risk** | Existing DBs cannot run baseline CREATE TABLE; require `migrate resolve --applied` after live schema match. |
| **Regression Risk** | Medium if cutover skipped; Low for fresh DBs after baseline. |
| **Tests Added** | `pnpm run db:sync-check`; fresh DB migrate+CRUD smoke |
| **Verification Steps** | Drop DB → `db:deploy` → `db:sync-check` (zero drift) → Prisma CRUD on Tenant/Lead/FollowUp/Feedback |
| **Deployment Notes** | See `packages/database/MIGRATION_BASELINE.md`. Do not deploy to existing Neon until resolve procedure is done. |

---

## Issue P1-02 — `prisma generate` fails under pnpm from package cwd

| Field | Value |
|---|---|
| **Severity** | High |
| **Evidence** | `pnpm --filter @saas/database exec prisma generate` → `Could not resolve @prisma/client despite the installation...`; succeeds from repo root. Also blocked previously by `ignoredBuiltDependencies` for Prisma. |
| **Root Cause** | pnpm workspace install/layout + Prisma 5.22 auto-install/resolve behavior when cwd is `packages/database`. |
| **Affected Layers** | ORM client generation → API build → Render buildCommand |
| **Proposed Fix** | 1) Allow Prisma build scripts in `pnpm-workspace.yaml`. 2) Hoist Prisma via `.npmrc`. 3) Custom client output `packages/database/generated/prisma`. 4) Generate via root script `scripts/prisma-generate.cjs`. 5) Re-export ORM from `@saas/database`; stop importing `@prisma/client` in API. |
| **Files To Change** | `pnpm-workspace.yaml`, `.npmrc`, `schema.prisma` generator, `packages/database/src/client.ts`, API repos, `render.yaml`, scripts |
| **Risk** | Import path change; build must always run generate before compile. |
| **Regression Risk** | Low if `build:api` / Render always call `db:generate`. |
| **Tests Added** | `pnpm run db:generate` + package build + API `tsc --noEmit` |
| **Verification Steps** | Generate, build `@saas/database`, import `prisma`/`Prisma`, API typecheck exit 0 |
| **Deployment Notes** | Render buildCommand now uses `pnpm run db:generate` (not filter exec generate). |

---

## Issue P1-03 — No automated schema↔migration sync gate

| Field | Value |
|---|---|
| **Severity** | High |
| **Evidence** | Drift existed for months with no failing check; band-aid `IF NOT EXISTS` migration `20260412183000` treated symptoms. |
| **Root Cause** | Missing validation script in CI/deploy. |
| **Affected Layers** | Migrations ↔ schema ↔ deploy |
| **Proposed Fix** | `scripts/db-sync-check.sh` + `pnpm run db:sync-check`; wired into Render buildCommand after deploy. Fails loudly on drift. |
| **Files To Change** | `scripts/db-sync-check.sh`, root/`@saas/database` package scripts, `render.yaml` |
| **Risk** | Builds fail if someone edits schema without regenerating baseline — intentional. |
| **Regression Risk** | None (fail-closed). |
| **Tests Added** | Sync-check script itself is the regression gate |
| **Verification Steps** | `pnpm run db:sync-check` with `DATABASE_URL` set |
| **Deployment Notes** | Keep this gate on; do not remove to “make deploy green”. |

---

## Hypotheses verified

| Audit claim | Result |
|---|---|
| Migrations do not reproduce schema | **Confirmed** (P3018 reproduce) |
| `Tenant.slug` missing from migrations | **Confirmed** |
| `FollowUp` missing from migrations | **Confirmed** |
| `Lead.phone` inconsistency | **Confirmed** |
| Feedback schema mismatch | **Confirmed** (message/approved vs comment/leadId/…) |
| Live DB state | **Not available** in this environment (`DATABASE_URL` unset for prod). Local Postgres used as reproducible surrogate. |

## Intentionally deferred (later phases)

- Dual theme storage / public payload hours
- Admin status enum mismatch
- 404 masking
- Frontend typecheck enablement
- Redis/queues
- Cascade rule changes on Feedback/FollowUp
- Shared API DTO package

## Commands that must pass after Phase 1

```bash
pnpm run db:validate
pnpm run db:generate
pnpm run db:deploy          # fresh DB only, or after resolve on existing
pnpm run db:sync-check
pnpm --filter @saas/database run build
pnpm exec tsc -p apps/api/tsconfig.json --noEmit
```

## Existing environment cutover (required before production deploy)

1. Backup Neon.
2. `prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel packages/database/prisma/schema.prisma --exit-code` must be `0`.
3. If drift: repair live schema to match `schema.prisma` with reviewed SQL (no `IF NOT EXISTS` band-aids).
4. `DELETE FROM "_prisma_migrations";`
5. `prisma migrate resolve --applied 20260801000000_baseline_schema`
6. Then deploy this branch.
