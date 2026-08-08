# FIS-000 Implementation Baseline

## Purpose
This document is the consolidated implementation baseline for DiningOS FIS-000 in the RiseLocal codebase.

It records:
- the approved FIS authority rules
- what has been implemented across Milestones 1-6
- what is only partially implemented
- what remains missing
- what is known technical debt
- what must not be changed unless a newer approved FIS explicitly supersedes the older baseline

This file is a status baseline, not a replacement for the approved FIS documents.

## Baseline Rules
1. Approved FIS documents are immutable baselines.
2. Earlier approved FIS behavior must not be changed unless a newer approved FIS explicitly supersedes it.
3. If a newer FIS conflicts with an older approved FIS, implementation must stop and the conflict must be reported for clarification.
4. Before implementing any new FIS, perform a full gap analysis against:
- FIS requirements
- existing implementation
- architecture
- APIs
- schema
- tests
5. Controllers should only receive requests, validate input, call application/service layer, and return responses.
6. Console logging is not auditing.
7. Future FIS scope must not be pulled into FIS-000 implementation.

## Active Source Documents
- Primary feature baseline: [FIS-000](/workspaces/riselocal_saas/FIS-000)
- Milestone 3 report: [FIS_000_MILESTONE_3_REPOSITORY_DOMAIN_REPORT.md](/workspaces/riselocal_saas/FIS_000_MILESTONE_3_REPOSITORY_DOMAIN_REPORT.md)
- Milestone 4 report: [FIS_000_MILESTONE_4_APPLICATION_SERVICES_REPORT.md](/workspaces/riselocal_saas/FIS_000_MILESTONE_4_APPLICATION_SERVICES_REPORT.md)
- Milestone 5 report: [FIS_000_MILESTONE_5_API_LAYER_REPORT.md](/workspaces/riselocal_saas/FIS_000_MILESTONE_5_API_LAYER_REPORT.md)
- Milestone 6 report: [FIS_000_MILESTONE_6_PRODUCTION_HARDENING_REPORT.md](/workspaces/riselocal_saas/FIS_000_MILESTONE_6_PRODUCTION_HARDENING_REPORT.md)

## Verification Summary Before Next Step
Current DiningOS implementation was checked against the approved [FIS-000](/workspaces/riselocal_saas/FIS-000#L614) baseline before any further work.

Status categories used in this document:
- Implemented
- Partially implemented
- Missing
- Conflicting
- Technical debt

## Requirement-to-Code Mapping

### Shared Canonical Contract Layer
Implemented.

Files:
- [packages/domain-core/dining/menu.contract.ts](/workspaces/riselocal_saas/packages/domain-core/dining/menu.contract.ts)
- [packages/domain-core/dining/menu.types.ts](/workspaces/riselocal_saas/packages/domain-core/dining/menu.types.ts)
- [packages/domain-core/dining/menu.events.ts](/workspaces/riselocal_saas/packages/domain-core/dining/menu.events.ts)
- [packages/domain-core/dining/menu.permissions.ts](/workspaces/riselocal_saas/packages/domain-core/dining/menu.permissions.ts)
- [packages/domain-core/dining/menu.validation.ts](/workspaces/riselocal_saas/packages/domain-core/dining/menu.validation.ts)
- [packages/domain-core/dining/index.ts](/workspaces/riselocal_saas/packages/domain-core/dining/index.ts)

Coverage:
- canonical enums
- canonical types
- canonical event payload interfaces
- permission constants
- validation helpers

Duplicate-definition verification:
- no duplicate canonical Dining enum/type declarations detected outside source contract package
- verified by [tests/dining/architecture.verification.test.cjs](/workspaces/riselocal_saas/tests/dining/architecture.verification.test.cjs)

### Database Foundation
Implemented at schema level.

File:
- [packages/database/prisma/schema.prisma](/workspaces/riselocal_saas/packages/database/prisma/schema.prisma)

Implemented models:
- Menu
- MenuCategory
- MenuItem
- ItemVariant
- ItemAddon
- ItemModifier
- ItemPrice
- ItemAvailability
- KitchenStation
- MenuItemImage

Implemented data concerns:
- tenant scoping
- location scoping
- audit metadata fields
- version fields
- soft delete fields
- relationship wiring
- indexes

Constraint note:
- migrations were intentionally deferred while the schema remained under active design

### Domain Layer
Implemented.

Files:
- [apps/api/src/modules/dining/domain/menu.aggregate.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/domain/menu.aggregate.ts)
- [apps/api/src/modules/dining/domain/category.entity.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/domain/category.entity.ts)
- [apps/api/src/modules/dining/domain/item.entity.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/domain/item.entity.ts)
- [apps/api/src/modules/dining/domain/variant.entity.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/domain/variant.entity.ts)
- [apps/api/src/modules/dining/domain/addon.entity.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/domain/addon.entity.ts)
- [apps/api/src/modules/dining/domain/modifier.entity.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/domain/modifier.entity.ts)
- [apps/api/src/modules/dining/domain/pricing.entity.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/domain/pricing.entity.ts)
- [apps/api/src/modules/dining/domain/availability.entity.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/domain/availability.entity.ts)
- [apps/api/src/modules/dining/domain/kitchen-station.entity.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/domain/kitchen-station.entity.ts)
- [apps/api/src/modules/dining/domain/domain-guards.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/domain/domain-guards.ts)

Implemented business-rule coverage:
- required field validation
- status normalization
- modifier type validation
- availability transition validation
- non-negative price validation
- archived-state mutability protection
- aggregate tenant/location consistency
- aggregate relationship consistency

### Repository Layer
Implemented.

Contracts:
- [apps/api/src/modules/dining/application/contracts/menu.repository.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/contracts/menu.repository.ts)
- [apps/api/src/modules/dining/application/contracts/kitchen-station.repository.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/contracts/kitchen-station.repository.ts)

Prisma implementations:
- [apps/api/src/modules/dining/infrastructure/repositories/prisma-menu.repository.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/infrastructure/repositories/prisma-menu.repository.ts)
- [apps/api/src/modules/dining/infrastructure/repositories/prisma-kitchen-station.repository.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/infrastructure/repositories/prisma-kitchen-station.repository.ts)

Implemented repository behaviors:
- tenant-aware lookups
- location-aware lookups
- aggregate persistence
- soft-delete archive path
- child record cascade archiving behavior

Repository caveat:
- Prisma delegate access currently uses dynamic casting rather than strict generated delegate types

### Application Services
Implemented.

Files:
- [apps/api/src/modules/dining/application/contracts/domain-event.publisher.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/contracts/domain-event.publisher.ts)
- [apps/api/src/modules/dining/application/services/menu.service.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/services/menu.service.ts)
- [apps/api/src/modules/dining/application/services/category.service.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/services/category.service.ts)
- [apps/api/src/modules/dining/application/services/menu-item.service.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/services/menu-item.service.ts)
- [apps/api/src/modules/dining/application/services/pricing.service.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/services/pricing.service.ts)
- [apps/api/src/modules/dining/application/services/availability.service.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/services/availability.service.ts)
- [apps/api/src/modules/dining/application/services/public-menu-query.service.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/services/public-menu-query.service.ts)
- [apps/api/src/modules/dining/application/services/kitchen-routing.service.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/services/kitchen-routing.service.ts)
- [apps/api/src/modules/dining/application/services/service-helpers.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/application/services/service-helpers.ts)

Implemented service behaviors:
- menu create/update/archive
- category create/archive
- item create/archive
- variant create rule enforcement
- modifier create rule enforcement
- pricing create/update rule enforcement
- availability update rule enforcement
- public menu filtering
- kitchen station assignment validation
- canonical event emission contract

### Presentation Layer
Implemented.

Files:
- [apps/api/src/modules/dining/presentation/dining.controller.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/presentation/dining.controller.ts)
- [apps/api/src/modules/dining/presentation/dining.routes.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/presentation/dining.routes.ts)
- [apps/api/src/modules/dining/presentation/dining.public.routes.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/presentation/dining.public.routes.ts)
- [apps/api/src/modules/dining/presentation/dining.dto.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/presentation/dining.dto.ts)
- [apps/api/src/modules/dining/presentation/dining.mapper.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/presentation/dining.mapper.ts)
- [apps/api/src/modules/dining/presentation/dining.validation.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/presentation/dining.validation.ts)
- [apps/api/src/modules/dining/presentation/dining-event.publisher.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/presentation/dining-event.publisher.ts)
- router registration: [apps/api/src/routes.ts](/workspaces/riselocal_saas/apps/api/src/routes.ts)

Implemented endpoint surface:
- POST /menus
- PATCH /menus/:id
- GET /menus/public
- POST /categories
- PATCH /categories/:id
- DELETE /categories/:id
- POST /items
- PATCH /items/:id
- PATCH /items/:id/availability
- POST /items/:id/variants
- DELETE /variants/:id
- POST /items/:id/addons
- POST /items/:id/modifiers

Middleware reuse:
- authMiddleware via global protected router pipeline
- tenantContextMiddleware via global protected router pipeline
- tenantAccessMiddleware via global protected router pipeline
- tenantResolver in public route flow
- canonical sendSuccess/sendError response helpers

### Test and Hardening Layer
Implemented.

Files:
- [tests/dining/domain.unit.test.cjs](/workspaces/riselocal_saas/tests/dining/domain.unit.test.cjs)
- [tests/dining/services.unit.test.cjs](/workspaces/riselocal_saas/tests/dining/services.unit.test.cjs)
- [tests/dining/integration.menu-flow.test.cjs](/workspaces/riselocal_saas/tests/dining/integration.menu-flow.test.cjs)
- [tests/dining/public-query.test.cjs](/workspaces/riselocal_saas/tests/dining/public-query.test.cjs)
- [tests/dining/api.routes.test.cjs](/workspaces/riselocal_saas/tests/dining/api.routes.test.cjs)
- [tests/dining/architecture.verification.test.cjs](/workspaces/riselocal_saas/tests/dining/architecture.verification.test.cjs)
- [tests/dining/fakes.cjs](/workspaces/riselocal_saas/tests/dining/fakes.cjs)

Implemented test coverage:
- unit tests for price, availability, variant, modifier rules
- integration flow for create menu, add item, update availability, archive behavior
- public menu query behavior
- API validation and route wiring checks
- domain event verification
- permission constant verification
- duplicate definition verification
- tenant/location isolation assertions
- historical compatibility soft-delete retention assertions

Verified commands:
- pnpm run test:dining
- pnpm exec tsc -p apps/api/tsconfig.json --noEmit
- pnpm --filter @saas/domain-core run test:contracts

## Implemented Items
- canonical Dining domain-core package
- schema-level Dining catalog foundation
- backend Dining domain model
- repository contracts and Prisma repository implementations
- application services for core menu engine operations
- API presentation layer for required endpoints
- validation wiring and DTO mapping
- hardening tests and architecture verification tests

## Partially Implemented Items
- auditing
  - domain events are emitted, but audit persistence is not implemented
- repository typing
  - behavior exists, but strict Prisma delegate typing is deferred
- public tenancy ergonomics
  - public menu route works through tenant resolution plus location input, but the FIS base-path and public access ergonomics are not fully normalized
- historical compatibility
  - soft-delete and ID retention are validated, but there is no real order-module compatibility test because FIS-000 does not include orders

## Missing Items Against Approved FIS-000
1. API base path normalization
- FIS baseline specifies /api/v1/dining/menu as the base
- current implementation is mounted under /api with direct Dining paths

2. End-to-end workflow test
- FIS testing requirements include one full workflow from manager creation through customer ordering and kitchen receipt
- current coverage includes unit, integration, and API tests, but not a real E2E workflow

3. Persistent audit integration
- FIS acceptance requires sensitive changes to be audited
- current implementation only logs domain events

4. Database migration generation
- FIS implementation notes call for migrations
- migration generation remains intentionally deferred because the schema has been treated as still evolving

## Conflicting or Non-Aligned Areas
1. API base path mismatch
- Approved FIS says /api/v1/dining/menu
- current router exposes /api + Dining routes without the v1/dining/menu namespace

2. Controller responsibility drift
- Approved guardrail says controllers should not hold business rules
- current Dining controller contains direct mutation/orchestration logic for category update, item update, variant archive, and addon create behaviors

These are not silent behavior changes to be made automatically.
They are frozen as known gaps until a new approved FIS or explicit clarification says otherwise.

## Technical Debt
1. Business-rule leakage in presentation layer
- [apps/api/src/modules/dining/presentation/dining.controller.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/presentation/dining.controller.ts)

2. Permission enforcement is not explicit per endpoint
- permission constants exist, but route/controller permission gating is not wired per action

3. Event publisher is a placeholder
- [apps/api/src/modules/dining/presentation/dining-event.publisher.ts](/workspaces/riselocal_saas/apps/api/src/modules/dining/presentation/dining-event.publisher.ts)

4. Dynamic Prisma delegate casting remains in repository layer

5. No real E2E workflow yet

6. No persistent audit record path yet

## Immutable Behavioral Commitments From FIS-000 Already Reflected in Code
- only active menus are publicly visible
- only available items are publicly visible
- out-of-stock status is enforced by availability rules
- delete behavior is archival behavior, not hard delete
- price changes preserve historical compatibility assumptions via soft-delete retention and event-based separation of future state
- tenant isolation is required on repository/service boundaries
- location isolation is required on repository/service boundaries

## Readiness Assessment
Overall status: Conditionally ready as a frozen FIS-000 baseline.

Interpretation:
- The implemented codebase is sufficient as the current approved baseline for the Menu Engine.
- It is not yet safe to treat FIS-000 as fully closed for broad production rollout because the missing E2E workflow, persistent audit, and API base-path alignment remain open.
- Future Dining FIS work must treat the current implemented behavior as fixed unless a newer approved FIS explicitly supersedes it.

## Next-Step Gate
Before starting the next Dining FIS:
1. Read the next approved FIS in full.
2. Compare it to this baseline file and to [FIS-000](/workspaces/riselocal_saas/FIS-000).
3. Classify each requirement as implemented, partial, missing, conflicting, or technical debt.
4. If any new FIS conflicts with this approved baseline, stop and request clarification before changing code.