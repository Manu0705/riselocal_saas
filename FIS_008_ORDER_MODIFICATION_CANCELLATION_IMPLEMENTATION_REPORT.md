# FIS-008 Order Modification & Cancellation Engine Implementation Report

## Summary
FIS-008 has been implemented as an additive Ordering-domain workflow that introduces controlled post-submission modifications through request, approval, rejection, cancellation, and history endpoints.

The implementation preserves the FIS-007 immutable boundary by disallowing direct silent edits and routing changes through explicit modification requests and adjustments.

## Implemented Scope

### Canonical Contracts (domain-core)
Added:
- `packages/domain-core/dining/order-modification.contract.ts`
- `packages/domain-core/dining/order-modification.events.ts`
- `packages/domain-core/dining/order-modification.permissions.ts`
- `packages/domain-core/dining/order-modification.validation.ts`

Updated exports:
- `packages/domain-core/dining/index.ts`

Contract selftest extended:
- `packages/domain-core/scripts/contract-selftest.cjs`

### Database / Persistence
Updated Prisma schema (`packages/database/prisma/schema.prisma`) with:
- `DiningOrderModificationRequest`
- `DiningOrderItemAdjustment`
- reverse relations on `Tenant`, `DiningOrder`, and `DiningOrderItem`

Added indexes for:
- tenant/location/order/session/status lookups
- idempotency key lookup
- adjustment history queries

### Application Contracts + Repository
Added repository contract:
- `apps/api/src/modules/dining/application/contracts/order-modification.repository.ts`

Added Prisma implementation:
- `apps/api/src/modules/dining/infrastructure/repositories/prisma-order-modification.repository.ts`

### Service Layer
Added:
- `apps/api/src/modules/dining/application/services/order-modification.service.ts`

Implemented service flows:
- request modification with mandatory reason
- idempotent duplicate handling through idempotency key
- manager approval workflow
- manager rejection workflow
- item cancellation helper endpoint flow
- modification history read model

Key rules enforced:
- no direct edits to submitted/locked orders
- mandatory reason on all requests
- role-gated approval/rejection (manager only)
- session-active validation through existing `SessionStateGateway`
- kitchen-state gating for requester roles (non-manager requests blocked when item state is not mutable)

### API Layer
Added:
- `apps/api/src/modules/dining/presentation/order-modification.validation.ts`
- `apps/api/src/modules/dining/presentation/order-modification.controller.ts`
- `apps/api/src/modules/dining/presentation/order-modification.routes.ts`

Mounted in:
- `apps/api/src/modules/dining/presentation/dining.routes.ts`

Exposed endpoints:
- `POST /dining/orders/:orderId/modifications`
- `POST /dining/modifications/:modificationId/approve`
- `POST /dining/modifications/:modificationId/reject`
- `POST /dining/order-items/:orderItemId/cancel`
- `GET /dining/orders/:orderId/modifications`

### Event Surface
Extended event union:
- `apps/api/src/modules/dining/application/contracts/domain-event.publisher.ts`

Added events:
- `OrderModificationRequested`
- `OrderModificationApproved`
- `OrderModificationRejected`
- `OrderItemCancelled`
- `OrderModified`

These events are emitted as the integration seam for kitchen/billing consumers without implementing downstream FIS-012/FIS-013 behavior early.

### Testing
Added tests:
- `tests/dining/order-modification.routes.test.cjs`
- `tests/dining/order-modification.service.unit.test.cjs`

Updated architecture checks:
- `tests/dining/architecture.verification.test.cjs`
  - order-modification permission namespace uniqueness
  - event union token assertions

## Validation
Commands run:
- `pnpm run build:api`
- `pnpm run test:dining`

Result:
- `57` tests passed, `0` failed.

## Assumptions and Deferred Scope
Assumptions recorded and respected:
- Earlier approved FIS documents are frozen architecture baselines.
- Kitchen and billing synchronization are represented by canonical domain events only in this milestone.
- No direct kitchen orchestration logic (FIS-012) or billing execution logic (FIS-013) was implemented.
- Modification request idempotency is keyed through request idempotency identifiers when provided.

Deferred intentionally:
- kitchen-side accept/reject operational state machine
- billing settlement/refund/compensation workflows
- advanced inventory reconciliation and AI-assisted correction logic

## Architectural Outcome
FIS-008 provides a controlled correction layer over committed orders, preserving immutable history and operational consistency while enabling authorized post-submission changes through auditable workflows.
