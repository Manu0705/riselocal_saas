# FIS-003 Table Status Engine Implementation Report

## Summary
FIS-003 has been implemented as a new Dining table aggregate slice with canonical contracts, Prisma persistence, application services, HTTP routes, and regression tests. The implementation is additive and preserves earlier approved FIS behavior.

## Implemented
- Canonical table domain contracts under `packages/domain-core/dining`.
- Table status validation and transition rules.
- Table permissions constants.
- Table domain events for occupancy, status changes, cleaning, maintenance, and waiter assignment.
- Prisma `DiningTable` model and the `DiningSession -> DiningTable` relation.
- API repository, service, controller, validation, and route wiring for `/dining/tables`.
- Regression tests for table service behavior and route validation.

## Behavior Notes
- `DiningTable` is treated as a physical resource aggregate, separate from `DiningSession`.
- `activeSessionId` is modeled as a denormalized occupancy reference on the table record.
- Duplicate status and waiter requests are treated as idempotent no-ops when the requested state already matches the current state.
- Maintenance transitions are restricted to management-level roles in the API layer.
- `Reserved` is supported in the contract and state machine for forward compatibility, but no reservation workflow is implemented yet.

## Assumptions
- Earlier approved FIS documents remain frozen architecture.
- Later milestones may be referenced by identifiers or interfaces only.
- Session-driven automatic table transitions remain interface-ready but are not wired through a session aggregate service here because the current codebase does not expose a dedicated session orchestration layer to extend.
- Future reservation and table-merge behaviors are intentionally out of scope.

## Validation
- `pnpm run build:api`
- `pnpm run test:dining`

## Deferred
- Direct session-event orchestration into table state changes.
- Reservation workflow.
- Waiting queue workflows.
- Table transfer, merge, and split capabilities.
