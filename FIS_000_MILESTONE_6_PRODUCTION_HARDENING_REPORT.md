# FIS-000 Milestone 6 Production Hardening Report

## Final Implementation Report
Milestone 6 was implemented as a production-hardening pass focused on test coverage, architecture verification, and release readiness signals for DiningOS Menu Engine.

### Added Hardening Test Suite
Created test suite under `tests/dining/`:
- `tests/dining/domain.unit.test.cjs`
- `tests/dining/services.unit.test.cjs`
- `tests/dining/integration.menu-flow.test.cjs`
- `tests/dining/public-query.test.cjs`
- `tests/dining/api.routes.test.cjs`
- `tests/dining/architecture.verification.test.cjs`
- `tests/dining/fakes.cjs`

Updated script:
- Root `package.json`:
  - `test:dining`: `pnpm run build:api && node --test tests/dining/**/*.test.cjs`

### Coverage Delivered
- Unit tests:
  - Domain validation rules (pricing, availability transitions, modifier type validation, non-negative pricing)
  - Service-level event emission and rule enforcement
- Integration tests:
  - End-to-end in-memory menu flow (menu->category->item->pricing->availability->archive)
- API tests:
  - Route-level validation behavior for required params/body
  - Public route presence verification
- Domain event verification:
  - Emitted canonical event names verified
- Permission verification:
  - Permission constants uniqueness and namespace checks
  - Protected-vs-public route wiring order check in global router
- Validation tests:
  - Middleware validation responses verified through API tests
- Public menu query tests:
  - Active/available filtering behavior validated
- Availability tests:
  - Transition rule enforcement and event emission validated
- Pricing tests:
  - Variant ownership and pricing validation behavior validated
- Soft delete tests:
  - Category and item archival cascading behavior validated
- Historical order compatibility tests:
  - Archived entities retain IDs and are soft-deleted (no hard delete), preserving referential compatibility assumptions

## Architectural Verification
Review focus areas requested were executed and verified with automated checks plus code review.

### Tenant isolation
Status: PASS (with caveat)
- Repository tests and static assertions verify tenant-scoped signatures and tenant/location where-clause usage.
- Caveat: some API routes depend on authenticated tenant context rather than tenant path params.

### Location isolation
Status: PASS (with caveat)
- Service and repository method signatures include location scope.
- Static repository checks verify location filtering patterns.
- Caveat: location context currently comes from request body/query/header; consistency depends on caller discipline.

### Event contracts
Status: PASS
- Application event union in `domain-event.publisher` aligns with canonical domain-core Dining events.
- Service tests verify canonical event names are emitted.

### Repository consistency
Status: PASS (with technical debt)
- Contract methods are consistent and tenant/location-aware.
- Caveat: Prisma repository uses dynamic delegate casting patterns instead of strict generated delegate typings.

### Shared contract usage
Status: PASS
- Canonical contracts in `packages/domain-core/dining` are consumed across domain/application/presentation layers.

### Duplicate definitions
Status: PASS
- No duplicate canonical Dining enum/type declarations were detected outside `packages/domain-core/dining` source contracts.

### Dead code
Status: PARTIAL
- Removed one dead test bootstrap helper (`tests/dining/_setup.cjs`).
- Remaining candidate dead code noted in technical debt section.

### Architecture violations
Status: PARTIAL
- Significant issues remain; see technical debt.

## Remaining Technical Debt
1. Business-rule leakage in presentation layer:
- `apps/api/src/modules/dining/presentation/dining.controller.ts` contains mutation logic (category/item update transforms, variant archive handling, addon creation checks) that belongs in domain/application services.

2. Permission enforcement not explicit per endpoint:
- Permission constants exist in domain-core, but route/controller permission guards are not wired per action (only global auth/tenant checks).

3. Event publisher is a placeholder:
- `LoggingDiningEventPublisher` logs events but is not integrated with persistent/event-bus infrastructure.

4. Dynamic Prisma delegate casting:
- Dining Prisma repositories rely on `unknown` delegate casting rather than strongly typed generated delegates.

5. Public menu endpoint tenancy ergonomics:
- Public route currently relies on tenant resolver header-based behavior; URL/tenant context strategy should be standardized.

6. Candidate unused API method:
- `updateItemPricing` exists in controller but no corresponding route in the requested API surface.

7. Historical order compatibility is assumption-based:
- Validation confirms soft-delete ID retention, but no real order module integration test currently verifies historical order rendering/query behavior.

## Readiness Assessment
Overall readiness: CONDITIONAL READY

Rationale:
- Strong automated hardening coverage now exists for core Menu Engine behavior.
- Builds, type checks, and domain contract self-tests pass.
- Critical architecture debt remains (notably presentation-layer business logic and missing permission guard wiring), which should be addressed before high-scale production rollout.

Recommended release gate posture:
- Internal/limited rollout: acceptable.
- Broad production rollout: defer until architecture debt items 1 and 2 are remediated.

## Verification Commands Executed
- `pnpm run test:dining`
- `pnpm exec tsc -p apps/api/tsconfig.json --noEmit`
- `pnpm --filter @saas/domain-core run test:contracts`
- Build pipeline exercised through `test:dining` (`build:api` + package builds + Prisma generate).
