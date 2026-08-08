# FIS-007 Order Locking Engine Implementation Report

## Summary
FIS-007 has been implemented as an additive commitment boundary for DiningOS ordering. The implementation introduces explicit order lock state, lock lifecycle endpoints, item-level lock status persistence, lock audit events, and idempotent lock behavior.

This implementation keeps earlier approved FIS architecture frozen and avoids introducing future kitchen or billing workflow logic beyond contract/event identifiers.

## Implemented Scope

### Canonical Contracts (Domain-Core)
Added FIS-007 contract modules:
- `packages/domain-core/dining/order-lock.contract.ts`
- `packages/domain-core/dining/order-lock.events.ts`
- `packages/domain-core/dining/order-lock.permissions.ts`
- `packages/domain-core/dining/order-lock.validation.ts`

Also updated existing order contract surface:
- `OrderStatus` extended with lock/reopen states (`LOCKED`, `REOPEN_REQUESTED`, `REOPENED`)
- `OrderItemRecord` extended with lock metadata fields

Exports updated in:
- `packages/domain-core/dining/index.ts`

### Database / Persistence
Schema updates in `packages/database/prisma/schema.prisma`:
- Added `DiningOrderLock` table:
  - per-order lock state
  - actor/time/reason
  - idempotency key support
  - versioning and indexes
- Added `DiningOrderLockEvent` table:
  - immutable lock transition audit history
- Extended `DiningOrderItem` with:
  - `lockStatus`
  - `lockedAt`
  - `lockedBy`
- Added reverse tenant/order relations for lock entities.

### Application Contracts + Infrastructure
Added lock repository contract:
- `apps/api/src/modules/dining/application/contracts/order-lock.repository.ts`

Added Prisma repository implementation:
- `apps/api/src/modules/dining/infrastructure/repositories/prisma-order-lock.repository.ts`

### Lock Service
Added:
- `apps/api/src/modules/dining/application/services/order-lock.service.ts`

Implemented methods:
- `getLockStatus`
- `lockOrder`
- `requestReopen`
- `reopenOrder`

Behavior implemented:
- Session active validation via existing `SessionStateGateway` seam.
- Role checks for lock, reopen request, and manager-only reopen.
- Version-guarded lock update path (`409` conflict semantics through service/controller mapping).
- Item lock propagation (`DRAFT -> LOCKED` on lock, `-> DRAFT` on manager reopen).
- Lock idempotency handling via existing lock state and idempotency key marker.
- Lock transition audit event persistence.

### API Layer
Added new route/controller/validator files:
- `apps/api/src/modules/dining/presentation/order-lock.routes.ts`
- `apps/api/src/modules/dining/presentation/order-lock.controller.ts`
- `apps/api/src/modules/dining/presentation/order-lock.validation.ts`

Routes mounted in protected dining router (`dining.routes.ts`):
- `POST /dining/orders/:orderId/lock`
- `POST /dining/orders/:orderId/reopen-request`
- `POST /dining/orders/:orderId/reopen`
- `GET /dining/orders/:orderId/lock`

### Domain Event Integration
`apps/api/src/modules/dining/application/contracts/domain-event.publisher.ts` extended with:
- `OrderLockRequested`
- `OrderLocked`
- `OrderReopened`
- `OrderLockFailed`

These remain contract-level integration points for future Kitchen/Billing consumers.

## Testing
Added tests:
- `tests/dining/order-lock.service.unit.test.cjs`
- `tests/dining/order-lock.routes.test.cjs`

Updated architecture guard:
- `tests/dining/architecture.verification.test.cjs`
  - order-lock permissions namespaced uniqueness
  - event union token presence

Updated contract selftest:
- `packages/domain-core/scripts/contract-selftest.cjs`
  - lock status normalization
  - lock transition validation assertions

## Validation
Commands run:
- `pnpm run build:api`
- `pnpm run test:dining`

Result:
- Dining tests passing: `52 passed`, `0 failed`.

## Assumptions and Deferred Scope
Assumptions recorded and respected:
- Earlier approved FIS documents are frozen architecture baselines.
- Future milestone references (kitchen orchestration, billing workflows) are represented by event contracts and stable lock data only.
- Atomicity uses repository update semantics and consistent write ordering in this slice; dedicated transaction wrapper with external side-effect orchestration can be layered when downstream consumers are implemented.
- Staff location membership continues to rely on tenant-scoped auth plus location-scoped request/session checks under current data model.

Deferred intentionally (future milestones):
- Kitchen execution state machine and production scheduling.
- Billing settlement workflows.
- Advanced dispute workflows and AI-assisted correction tooling.

## Architectural Outcome
FIS-007 now provides a concrete commitment boundary between mutable cart intent and immutable operational order execution inputs.

Downstream systems should consume lock states and lock events, not mutable cart drafts.
