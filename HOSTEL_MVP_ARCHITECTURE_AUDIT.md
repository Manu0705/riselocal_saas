# Hostel MVP Architecture and Feasibility Audit

**Repository:** RiseLocal SaaS monorepo  
**Audit date:** 2026-09-05  
**Scope:** Existing repository structure, runtime code, Prisma schema/migrations, tenant/auth boundaries, frontend shell, deployment, and validation scripts.

## Feasibility Summary

A hostel module is feasible as an additive tenant-scoped domain. The repository already provides the runtime boundaries needed for a safe first slice: Express route composition, JWT authentication, tenant context/access middleware, Prisma/PostgreSQL, a layered dining module pattern, the web dashboard shell, and a tenant-aware API client. The foundation described below is implemented without adding a second tenant system.

The existing schema had no hostel, lodging, billing, payment, receipt, ledger, or reconciliation models. The implemented safe foundation maps the existing tenant-owned `HostelProperty` table to a `Hostel` model and adds tenant-safe `Room`, `Student`, and `HostelStaffAssignment` models, API routes, and a dashboard entry page. Beds, stays, charges, payments, receipts, and reconciliation remain later slices requiring explicit invariants and idempotency contracts.

## 1. Existing Reusable Backend Modules

- `apps/api/src/routes.ts` is the central Express route aggregator and already applies the protected-route chain.
- `apps/api/src/modules/dining` is the strongest reusable module pattern: domain/application/infrastructure/presentation layering, Prisma repositories, services, validation, controllers, and nested route aggregators.
- Tenant modules provide tenant lookup, settings, users, and authorization-adjacent behavior.
- Shared HTTP responses use `apps/api/src/shared/http/api-response.ts` and the domain-core API response contract.
- Existing middleware provides JWT auth, tenant resolution from route/header/query/subdomain, tenant access enforcement, error handling, rate limiting, sanitization, and role guards.
- `@saas/database` exposes the generated Prisma client; `@saas/domain-core` contains shared auth and domain contracts.
- Existing upload, cache, queue, and worker areas are reusable integration points, but cache/queue/worker implementations are currently limited or stub-like and are not a substitute for financial persistence.

## 2. Existing Reusable Frontend Components

- `apps/web/app/(dashboard)/dashboard/layout.tsx` provides the authenticated dashboard shell, `RequireAuth`, tenant data provider, header, and bottom navigation.
- `apps/web/app/(dashboard)/dashboard/components/dashboard-header.tsx` owns dashboard menu navigation and can receive a Hostel entry without introducing another shell.
- `apps/web/lib/api-client.ts` already attaches the JWT and tenant slug, resolves the API base URL, handles JSON envelopes, and redirects on unauthorized responses.
- Existing pages demonstrate the project conventions for cards, forms, loading/error states, modal-like forms, icons, `sonner` notifications, and responsive inline styling.
- Existing shared UI and page components include `Card`, `StatCard`, `PageErrorState`, `MobilePageTitle`, and dashboard data/auth contexts. The shared `packages/ui` components are incomplete and should not be duplicated or adopted as a new requirement for this slice.
- The admin app has its own dashboard shell and navigation, but the requested module entry point can safely begin in the tenant web dashboard.

## 3. Existing Database Models and Migrations

- `packages/database/prisma/schema.prisma` currently contains `Tenant`, tenant users/settings/content, lead/feedback/booking models, and the additive dining/menu/table/cart/order models.
- Dining uses tenant/location-scoped records, but `locationId` is a string inside dining models and there is no reusable property/building/room hierarchy.
- No models exist for properties, buildings, floors, rooms, beds, occupants, stays, reservations, charges, invoices, payments, refunds, receipts, tax records, ledgers, settlements, bank statements, reconciliation matches, or provider webhook idempotency.
- The active migration history is a known architectural risk: the repository contains a baseline migration and audit documentation describing prior schema/migration drift. Any new migration must be validated against the current schema and deployment database before release; do not use hostel work to silently repair unrelated historical drift.
- The safe first DB addition is one tenant-owned base property model with explicit tenant indexes and cascade behavior. It should not add speculative payment tables or generic `Transaction` models.

## 4. Existing Tenant Infrastructure

- API tenant context accepts route parameters, `x-tenant-slug`, query values, and supported subdomains through `tenant-context.middleware.ts`.
- `tenant-access.middleware.ts` checks route/resolved/user tenant identity and sets the effective tenant route parameter.
- Web middleware and tenant resolver support path-based tenant routing and subdomains.
- New hostel records must always include `tenantId`; repositories and service queries must retain tenant predicates even though the global middleware also runs.
- `Hostel` is the existing `HostelProperty` table mapped to a domain-appropriate name. It is a tenant-owned resource, not a new tenant type and not a replacement for existing dining locations.

## 5. Existing Authentication and RBAC

- JWT login and verification are implemented in `apps/api/src/modules/auth`.
- Canonical roles are `owner`, `manager`, `staff`, `admin`, and `super_admin`; tenant users currently use `owner`, `manager`, and `staff`.
- Existing `roleGuard` supports route-level role checks. The first property-management write route should use existing `owner`/`manager` roles; no new receptionist/accountant/auditor roles should be invented in the foundation slice.
- Financial operations will need a permissions matrix and audit actor model before payment or reconciliation mutations are exposed.

## 6. Existing Deployment Infrastructure

- Root pnpm scripts build packages, API, web, and admin; Prisma generation/deployment is handled by existing scripts.
- Render configuration in `render.yaml` deploys the API and runs the existing migration/build flow; the web app follows the existing Vercel-style Next.js deployment path.
- Environment loading is centralized in the API config and root run helpers. There are currently no payment-provider keys, webhook secrets, receipt storage settings, currency/accounting configuration, or durable document delivery settings.
- No new environment variables are needed for the property foundation.

## 7. What Must Be Extended

- Prisma schema and migrations extend the existing tenant-owned property table and add tenant-safe hostel resources.
- API route composition mounts the hostel router after existing auth/tenant middleware.
- API module code uses a repository/service/controller implementation for hostels, rooms, students, and staff assignments, with canonical responses and existing role guards.
- Web dashboard navigation/header exposes the module through the existing authenticated page.
- Existing validation commands must include Prisma validation, package/API typechecks, lint, tests, and builds.

## 8. What Must Be Newly Created

Implemented foundation:

- `Hostel` Prisma model mapped to the existing `HostelProperty` table, with status enum and tenant indexes.
- Tenant-safe `Room`, `Student`, and `HostelStaffAssignment` models with composite parent/user relations, unique constraints, indexes, timestamps, and room-capacity validation.
- Layered tenant-scoped API routes for hostels, rooms, students, and staff assignments.
- Student management supports CRUD, search, room/payment/status filters, pagination, validation, and student-account self-read restrictions.
- Room management supports occupancy/sharing/vacancy state, vacancy summaries, room details/history, transactional allocation/deallocation, auto-assignment, and final-vacancy concurrency coverage.
- A web dashboard Hostel page and navigation entry using the existing shell, API client, and notification patterns.
- Focused cross-tenant isolation tests for reads, writes, and invalid context.

Later, as separate reviewed slices:

- Property hierarchy: buildings/floors/rooms/beds and availability invariants.
- Guest/stay lifecycle and allocation rules.
- Charge catalog, folio, invoice, payment/refund, receipt numbering/snapshots, and tax policy.
- Payment-provider adapter, webhook replay/idempotency records, and durable receipt storage/delivery.
- Ledger/journal, reconciliation import/matching/exceptions/approval, and immutable audit history.
- Focused contracts, tenant-isolation, financial idempotency, receipt numbering, and reconciliation-balance tests.

## 9. Architectural Conflicts and Risks

- **Migration history drift:** existing audit material documents that clean migration deployment has not always matched `schema.prisma`. This is a release blocker to verify, not something to hide inside a hostel migration.
- **Dining location vs hostel property:** dining's string `locationId` must not be retrofitted into hostel property ownership without an explicit cross-domain decision.
- **Mixed API layering:** some legacy modules access Prisma directly while dining uses layered modules. Hostel should follow the newer dining pattern and avoid creating another direct-Prisma route style.
- **Stringly typed roles/statuses:** existing role vocabulary is reusable for now, but financial roles and states require canonical contracts before implementation.
- **Incomplete queue/cache/storage infrastructure:** asynchronous provider events and receipt delivery cannot safely depend on current stubs alone.
- **No payment contract yet:** adding payment tables before defining idempotency, provider event replay, allocation, refund, and audit semantics would create unsafe parallel abstractions.

## 10. Recommended Implementation Order

1. Verify current Prisma migration/schema state and record any pre-existing drift.
2. Extend the mapped tenant-owned hostel table with rooms, students, and staff assignments; validate tenant isolation and generated client output.
3. Add guests/stays and allocation workflows.
4. Define and implement charge/folio/invoice/payment/refund/receipt contracts with idempotency and immutable audit history.
5. Add provider webhooks and reconciliation only after the ledger and balancing rules are testable.
6. Run database validation, typechecks, lint, existing tests, and all application builds before deployment.

## Validation Baseline

The repository scripts currently provide `db:validate`, `db:status`, `db:sync-check`, `build:packages`, `build:api`, `build:web`, `build:admin`, `test:contracts`, `test:dining`, `test:hostel`, `lint`, and `format:check`. The requested completion gate is to run the available typecheck, lint, existing tests, and build commands after the foundation is implemented, while reporting any pre-existing migration or environment blocker separately.
