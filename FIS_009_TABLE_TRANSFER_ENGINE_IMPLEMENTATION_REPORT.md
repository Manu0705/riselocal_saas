# FIS-009 Table Transfer Engine Implementation Report

## Summary
FIS-009 has been implemented as an additive Tables/Session workflow that introduces auditable table transfer requests, approval/rejection gates, transfer execution, and assignment/history tracking while preserving session identity.

The implementation follows frozen-architecture and milestone-order constraints, using typed events as integration seams and avoiding early implementation of future kitchen/billing milestones.

## Implemented Scope

### Canonical Contracts (domain-core)
Added:
- `packages/domain-core/dining/table-transfer.contract.ts`
- `packages/domain-core/dining/table-transfer.events.ts`
- `packages/domain-core/dining/table-transfer.permissions.ts`
- `packages/domain-core/dining/table-transfer.validation.ts`

Updated exports:
- `packages/domain-core/dining/index.ts`

Contract selftest extended:
- `packages/domain-core/scripts/contract-selftest.cjs`

### Database / Persistence
Updated Prisma schema (`packages/database/prisma/schema.prisma`) with:
- `DiningTableAssignment`
- `DiningTableTransferRequest`
- reverse relations on `Tenant`, `Location`, `DiningTable`, and `DiningSession`

Added indexes for:
- tenant/location/session transfer history lookups
- transfer status workflow queries
- assignment lifecycle queries

### Application Contracts + Repository
Added repository contract:
- `apps/api/src/modules/dining/application/contracts/table-transfer.repository.ts`

Added Prisma implementation:
- `apps/api/src/modules/dining/infrastructure/repositories/prisma-table-transfer.repository.ts`

Repository behavior includes:
- session/table scoped reads
- transfer request creation
- status transitions (REQUESTED -> APPROVED/REJECTED)
- transactional transfer execution (session table change + old/new table state updates + assignment release/recreate)
- session history read model (assignments + transfers)

### Service Layer
Added:
- `apps/api/src/modules/dining/application/services/table-transfer.service.ts`

Implemented service flows:
- transfer request with role gate, reason requirement, active session validation, destination validation
- transfer approval with role gate, status transition guard, billing-stage restriction for reception roles, and execution
- transfer rejection with mandatory reason and transition guard
- transfer history retrieval

Key rules enforced:
- source and destination tables must differ
- destination table cannot be in maintenance
- destination table must be available/reserved and not occupied by another active session
- closed/archived sessions are not transferable
- approvals/rejections are limited to reception/manager-class roles

### API Layer
Added:
- `apps/api/src/modules/dining/presentation/table-transfer.validation.ts`
- `apps/api/src/modules/dining/presentation/table-transfer.controller.ts`
- `apps/api/src/modules/dining/presentation/table-transfer.routes.ts`

Mounted in:
- `apps/api/src/modules/dining/presentation/dining.routes.ts`

Exposed endpoints:
- `POST /dining/table-transfer/sessions/:sessionId/transfer`
- `POST /dining/table-transfer/transfers/:transferId/approve`
- `POST /dining/table-transfer/transfers/:transferId/reject`
- `GET /dining/table-transfer/sessions/:sessionId/table-history`

### Event Surface
Extended event union:
- `apps/api/src/modules/dining/application/contracts/domain-event.publisher.ts`

Added events:
- `TableTransferRequested`
- `TableTransferApproved`
- `SessionTableChanged`
- `OldTableReleased`
- `NewTableOccupied`
- `TableTransferCompleted`
- `TableTransferRejected`

These events provide forward-compatible seams for later kitchen/billing and analytics milestones without implementing those workflows early.

### Testing
Added tests:
- `tests/dining/table-transfer.service.unit.test.cjs`
- `tests/dining/table-transfer.routes.test.cjs`

Updated architecture checks:
- `tests/dining/architecture.verification.test.cjs`
  - table-transfer permission namespace uniqueness
  - event union token assertions for all FIS-009 event names

## Validation
Commands run:
- `pnpm run build:api`
- `pnpm run test:dining`

Result:
- `63` tests passed, `0` failed.

## Assumptions and Deferred Scope
Assumptions recorded and respected:
- Earlier approved FIS documents are treated as frozen architecture.
- Future milestone dependencies are represented through identifiers/interfaces/events only.
- Implementation proceeds without blocking on unimplemented future FIS milestones.

Deferred intentionally:
- session merge/split mechanics
- cross-location table transfer orchestration
- downstream kitchen routing reallocation logic
- downstream billing split/reallocation logic

## Architectural Outcome
FIS-009 establishes a robust, auditable table transfer engine that preserves session continuity while safely transitioning occupancy state and maintaining historical assignment traceability for operations and compliance.