# Phase 3 — Frontend Synchronization

**Status:** Complete  
**Branch:** `cursor/phase3-frontend-sync-7ca4`  
**Depends on:** Phase 2 shared contracts (`cursor/phase2-api-shared-contracts-7ca4`)  
**Date:** 2026-08-01

---

## Scope

Align web/admin with the Phase 2 contract surface and remove frontend failure modes identified in the architecture audit:

| ID | Issue | Fix |
|---|---|---|
| E7 | TenantLayout maps API outages → 404 | Resolver throws on transport errors; layout only `notFound()` on null |
| E14 | Booking clears form without success | `booking.tsx` gates clear/success UI on `result.success` |
| E10 | `ignoreBuildErrors: true` | Disabled for web + admin; `tsc --noEmit` clean |
| Sync | Login envelope after `sendSuccess` | Web/admin auth unwrap `{ success, data: { token, user } }` |
| Sync | Remaining lead status locals | Dashboard home + leads page use `normalizeLeadStatus` |
| Sync | Theme dual-read | `resolveThemeInput` / prefer `theme` then `themeKey` |

---

## Issue P3-01 — Outage → 404 masking

| Field | Value |
|---|---|
| **Evidence** | `layout.tsx` catch-all → `notFound()`; resolver suppressed errors when any candidate returned 404 |
| **Fix** | Layout awaits `getTenant` without catch. Resolver: `if (lastError) throw lastError`; null only for confirmed miss |
| **Files** | `apps/web/app/(public)/[tenantSlug]/layout.tsx`, `apps/web/lib/tenant-resolver.ts` |
| **Result** | Network/5xx hit `error.tsx` (“Temporary issue”); true missing tenant stays 404 |

---

## Issue P3-02 — Booking soft-fail UX

| Field | Value |
|---|---|
| **Evidence** | Default `booking.tsx` always cleared form after `capturePublicCtaLead` |
| **Fix** | Check `result.success`; show error/success copy; clear only on success |
| **Files** | `apps/web/app/(public)/[tenantSlug]/components/booking.tsx` |

---

## Issue P3-03 — Typecheck gate

| Field | Value |
|---|---|
| **Evidence** | `apps/web/next.config.js` + `apps/admin/next.config.js` skipped TS |
| **Fix** | `typescript.ignoreBuildErrors = false`; fixed `top-header` window typing, login `tenantSlug`, admin Lucide icon typing |
| **Verification** | `npx tsc --noEmit` for web and admin passes |

---

## Issue P3-04 — Auth envelope sync

| Field | Value |
|---|---|
| **Evidence** | Phase 2 `sendSuccess` nests token under `data`; clients still read top-level `token` |
| **Fix** | `apps/web/lib/auth.ts` + `apps/admin/lib/auth.ts` unwrap canonical envelope (legacy top-level still accepted) |

---

## Intentionally deferred

- Theme column vs JSON dual-storage collapse at DB/API (needs data migration; frontend now prefers contract helpers)
- Enabling eslint during builds
- Full Redis/cache work
- Broader Zod validation (API)

---

## Commands that must pass

```bash
pnpm --filter @saas/domain-core run build
npx tsc --noEmit -p apps/web/tsconfig.json
npx tsc --noEmit -p apps/admin/tsconfig.json
pnpm --filter @saas/web build
pnpm --filter @saas/admin build
```
