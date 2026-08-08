# FIS-004 Shared Cart Engine Implementation Report

## Summary
FIS-004 has been implemented as a new Dining shared cart slice with canonical contracts, Prisma persistence, application services, HTTP routes, and regression tests. The implementation is additive and preserves earlier approved FIS behavior.

## Implemented
- Canonical cart domain contracts under `packages/domain-core/dining`.
- Cart status validation and transition rules.
- Cart permissions constants.
- Cart domain events for creation, item mutation, removal, and submission.
- Prisma `DiningCart`, `DiningCartItem`, and `DiningCartSnapshot` models.
- API repository, service, controller, validation, and route wiring for `/dining/cart`.
- Session-state validation and menu snapshot validation during cart mutations.
- Real-time event publishing through the existing Dining domain event seam.
- Regression tests for cart service behavior and route validation.

## Behavior Notes
- The cart is treated as a shared session-scoped ordering workspace, separate from table state and session identity.
- Exactly one active cart is created on demand for an active session.
- Cart mutations are tenant-scoped, location-scoped, and role-gated.
- Menu item, variant, and modifier references are validated against the current menu snapshot before mutation.
- Price is snapshotted when the item is added or updated; explicit pricing rows override variant adjustments.
- Duplicate cart mutations are treated as no-ops where appropriate.
- Submission archives the current cart and creates the next active cart round without materializing a future order-round aggregate.

## Assumptions
- Earlier approved FIS documents remain frozen architecture.
- Later milestones may be referenced by identifiers or interfaces only.
- The order-round aggregate from FIS-005 is not implemented here; cart submission only emits the cart submission event and prepares the next active cart.
- Tax, service charge, billing, and kitchen ticket materialization remain out of scope for this milestone.
- Real-time transport wiring remains interface-ready through the existing domain event publisher seam.

## Validation
- `pnpm run build:api`
- `pnpm run test:dining`

## Deferred
- Order round persistence and orchestration.
- Kitchen ticket generation.
- Billing and payment calculations.
- Cross-session carts, wishlists, bundles, and coupons.
