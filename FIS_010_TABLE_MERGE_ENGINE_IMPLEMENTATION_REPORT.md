# FIS-010 Table Merge Engine Implementation Report

## Summary
FIS-010 has been implemented as an additive Tables/Session workflow that introduces auditable table merge requests, approval/rejection gates, group lifecycle management, and session-unified execution while preserving session identity and order ownership across all merged physical tables.

The implementation follows frozen-architecture and milestone-order constraints from FIS-001 through FIS-009, using typed events as integration seams and avoiding early implementation of future billing (FIS-013) or kitchen routing (FIS-012) milestones.

## Implemented Scope

### Canonical Contracts (domain-core)
Added:
- `packages/domain-core/dining/table-group.contract.ts`
- `packages/domain-core/dining/table-group.events.ts`
- `packages/domain-core/dining/table-group.permissions.ts`
- `packages/domain-core/dining/table-group.validation.ts`

Updated exports:
- `packages/domain-core/dining/index.ts`

Contract selftest extended:
- `packages/domain-core/scripts/contract-selftest.cjs`

### Database / Persistence
Updated Prisma schema (`packages/database/prisma/schema.prisma`) with:
- `DiningTableGroup`
- `DiningTableGroupMember`
- `DiningTableMergeRequest`
- Reverse relations on `Tenant`, `Location`, `DiningTable`, and `DiningSession`

Added indexes for:
- tenant/location/session group lookups
- group status workflow queries
- merge request lifecycle queries
- member release state queries

### Application Contracts + Repository
Added repository contract:
- `apps/api/src/modules/dining/application/contracts/table-group.repository.ts`

Added Prisma implementation:
- `apps/api/src/modules/dining/infrastructure/repositories/prisma-table-group.repository.ts`

Repository behavior includes:
- session/table scoped reads for validation
- merge request creation
- status transitions (REQUESTED → APPROVED → COMPLETED / REJECTED)
- transactional group creation: create group, create members, update all table statuses to OCCUPIED with shared session linkage
- group release transaction: update all member table statuses to CLEANING, clear activeSessionId, mark members released, mark group RELEASED

### Service Layer
Added:
- `apps/api/src/modules/dining/application/services/table-group.service.ts`

Implemented service flows:
- merge request with role gate, reason requirement, minimum two-table validation, same-location validation, maintenance check, occupied-by-other-session check, active-group check
- merge approval with role gate, status transition guard, per-table re-validation, transactional group execution, event chain
- group release with role gate, ACTIVE group guard, transactional release execution

Key rules enforced per FIS-010 spec:
- minimum 2 tables required
- all tables must belong to same location (cross-location merge blocked)
- no table under maintenance may be merged
- no table already belonging to another active session
- no table already in another active group
- approvals restricted to reception/manager-class roles
- override for occupied tables restricted to manager-class roles
- one session owns the merge; multi-session merges are invalid

### API Layer
Added:
- `apps/api/src/modules/dining/presentation/table-group.validation.ts`
- `apps/api/src/modules/dining/presentation/table-group.controller.ts`
- `apps/api/src/modules/dining/presentation/table-group.routes.ts`

Mounted in:
- `apps/api/src/modules/dining/presentation/dining.routes.ts`

Exposed endpoints:
- `POST /dining/table-groups/merge`
- `POST /dining/table-groups/merge/:mergeId/approve`
- `POST /dining/table-groups/groups/:groupId/release`

### Event Surface
Extended event union:
- `apps/api/src/modules/dining/application/contracts/domain-event.publisher.ts`

Added events:
- `TableMergeRequested`
- `TableMergeApproved`
- `TableGroupCreated`
- `TablesMerged`
- `TableGroupReleased`

These events provide forward-compatible seams for later floor dashboard, kitchen routing (FIS-012), billing (FIS-013), and analytics milestones without implementing those workflows early.

### Testing
Added tests:
- `tests/dining/table-group.service.unit.test.cjs`
- `tests/dining/table-group.routes.test.cjs`

Updated architecture checks:
- `tests/dining/architecture.verification.test.cjs`
  - table-group permission namespace uniqueness
  - event union token assertions for all FIS-010 event names

## Validation
Commands run:
- `pnpm run build:api`
- `pnpm run test:dining`

Result:
- `67` tests passed, `0` failed.

## Assumptions and Deferred Scope
Assumptions recorded and respected:
- Earlier approved FIS documents (FIS-001 through FIS-009) are treated as frozen architecture.
- Future milestone dependencies are represented through identifiers, interfaces, and event payloads only.
- No kitchen routing reallocation (FIS-012) or billing split/unification (FIS-013) logic was implemented early.
- Automatic table combination and reservation-based merging are explicitly out-of-scope for this milestone.
- Split bill functionality across merged tables is deferred to FIS-013 Billing & Payment.

Deferred intentionally:
- Automatic table combination based on party size
- Reservation-based merge pre-assignment
- Dynamic restaurant layout optimization
- Multi-location table group orchestration
- Split bill generation per merged table (FIS-013)
- Kitchen station reallocation across merged tables (FIS-012)
- FIS-011 Table Split Engine (next milestone)

## Architectural Outcome
FIS-010 establishes a robust, auditable table merge engine that preserves session and order continuity while safely expanding the physical seating footprint. Group lifecycle is tracked from merge request through approval, active usage, and session-closure-triggered release, with complete audit history and floor-view event seams for downstream consumers.
