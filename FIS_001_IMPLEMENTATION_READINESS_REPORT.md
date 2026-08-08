# FIS-001 Implementation Readiness Report

## Purpose
This document is the mandatory pre-implementation gap analysis for FIS-001 Dining Session Engine.

No code changes are proposed in this report.
It exists to compare:
- FIS-001 requirements
- existing implementation
- existing architecture
- existing APIs
- existing database schema
- existing tests
- frozen FIS-000 baseline

## FIS Baseline Relationship
FIS-001 does not supersede FIS-000 Menu Engine behavior.
It defines a new canonical Session Aggregate that later Dining FIS documents should extend incrementally.

Result:
- No direct behavioral conflict with approved FIS-000 was found.
- FIS-000 remains frozen.
- FIS-001 may proceed only as an additive session-domain implementation.

## Incremental Specification Model
Approved interpretation for future Dining FIS documents:
- FIS-001 defines the complete Session Aggregate and its invariants.
- FIS-002 extends FIS-001 with secure session identity and joining.
- FIS-003 extends session behavior with table lifecycle.
- FIS-004 extends session behavior with collaborative carts.
- Later FIS documents extend the same aggregate rather than redefining session behavior from scratch.

This improves long-term consistency and reduces duplicated rules.

## Existing Implementation Audit

### Already Implemented
Menu Engine foundation from FIS-000 exists in these areas:
- shared Dining contracts in `packages/domain-core/dining`
- Prisma menu catalog schema in `packages/database/prisma/schema.prisma`
- Dining API module in `apps/api/src/modules/dining`
- Dining hardening tests in `tests/dining`

This work does not implement a Dining Session aggregate.

### Current Reusable Platform Patterns
Reusable patterns already present in RiseLocal:
- Domain/entity + repository + application-service layering in `apps/api/src/modules/*`
- tenant and location scoping patterns in Dining repositories and services
- optimistic mutation style via `version` fields in Dining models
- canonical API success/error envelope in shared HTTP helpers
- auth and tenant middleware pipeline in the API router
- soft-delete conventions using `deletedAt`
- timeline/activity-like precedent in lead lifecycle tables: `LeadSession`, `LeadActivity`

### Not Currently Present
No concrete existing implementation was found for:
- dining session aggregate
- table engine module
- table entity/table schema
- session participant model
- persistent Dining audit integration
- session timeline persistence
- dining session API surface

## Requirement-to-Code Mapping

### Aggregate Root: Dining Session
Status: Missing

FIS-001 requires a canonical Session Aggregate Root with lifecycle, concurrency, ownership, assignment, participant count, guest count, metadata, and closure semantics.

Current state:
- No `DiningSession` aggregate exists.
- No session domain module exists in `apps/api/src/modules/dining`.

### Session Invariants
Status: Missing

Required invariants include:
- one active session per table
- one tenant per session
- one location per session
- closed-session immutability
- version increment on every mutation

Current state:
- No domain code or schema currently enforces these invariants.

### Session Lifecycle
Status: Missing

Required states:
- Created
- Seated
- Active
- Ordering
- Dining
- Billing
- Completed
- Closed
- Archived

Current state:
- No session lifecycle enum/type/entity/service exists.

### Participant Management
Status: Missing

Current state:
- No participant entity/model/repository exists.
- FIS-001 explicitly defers participant role details to FIS-002, but FIS-001 still requires aggregate ownership of participants.

### Waiter Assignment
Status: Missing

Current state:
- No dining-session waiter assignment logic or history persistence exists.
- Existing `TenantUser` and role infrastructure can be reused.

### Session Metadata
Status: Missing

Current state:
- No Dining session metadata structure or JSON persistence exists.
- Existing schema patterns already support `Json` columns elsewhere and can be reused.

### Session Timeline
Status: Missing

Current state:
- No Dining session timeline persistence exists.
- `LeadActivity` provides an append-only activity precedent, but not a reusable shared abstraction.

### Audit Integration
Status: Missing

Current state:
- No persistent audit framework was identified for Dining.
- Existing Menu Engine uses logging-only event publication, which is explicitly insufficient for FIS-001.

### Event Publication
Status: Missing

Required events:
- SessionCreated
- SessionActivated
- WaiterAssigned
- GuestCountUpdated
- SessionStatusChanged
- SessionClosed
- SessionArchived

Current state:
- No session event contracts or publisher abstraction exist.

### API Layer
Status: Missing

Required base:
- `/api/v1/dining/sessions`

Required endpoints:
- POST /
- GET /:id
- GET /table/:tableId
- PATCH /:id/waiter
- PATCH /:id/guest-count
- PATCH /:id/status
- POST /:id/close

Current state:
- No Dining Session routes/controllers/DTOs exist.
- Existing Dining API currently covers only Menu Engine endpoints.

### Database Design
Status: Missing

Required table:
- `dining_sessions`

Required fields:
- id
- tenant_id
- location_id
- table_id
- status
- opened_by
- opened_at
- closed_by
- closed_at
- assigned_waiter_id
- guest_count
- current_round
- participant_count
- version
- metadata
- created_at
- updated_at
- created_by
- updated_by
- deleted_at

Required constraint:
- one active session per table

Current state:
- Table does not exist in Prisma schema.
- Table engine itself is not yet defined in current repo.
- Unique active-session-per-table cannot be implemented cleanly until table identity strategy is confirmed.

### Permissions / RBAC
Status: Partially supported by platform, missing in feature

Existing reusable platform capability:
- authenticated user context
- tenant access middleware
- role field on `TenantUser`

Missing feature work:
- session-specific permission contract
- waiter-limited action policy
- closure/archival role enforcement

### Failure Recovery / Idempotency
Status: Missing

Required behavior:
- duplicate create request returns existing active session
- concurrent updates handled safely
- idempotent creation and transitions where applicable

Current state:
- No session service or database constraint path exists.

### Testing
Status: Missing

Required coverage:
- unit
- integration
- end-to-end
- concurrency
- authorization
- timeline/audit/events verification

Current state:
- no session-specific tests exist

## Architecture Validation

### Domain Boundaries
Status: Clear target, not implemented
- FIS-001 fits the existing module structure used by Lead, Feedback, and Dining Menu.
- Aggregate-root-first design is compatible with current architecture.

### Repository Boundaries
Status: Compatible
- Existing RiseLocal patterns support repository contracts and Prisma repository implementations.

### Service Boundaries
Status: Compatible
- Existing service layer can host lifecycle, assignment, guest-count, and closure orchestration.

### Controller Responsibilities
Status: Guardrail noted
- FIS-001 should avoid repeating the controller drift already identified in FIS-000 Dining controller.
- Session business rules should stay in domain/application layers.

### Module Isolation
Status: Compatible
- New Session module can be added under `apps/api/src/modules/dining` without modifying Menu Engine behavior.

### Tenant Isolation
Status: Compatible but must be explicit
- Existing platform patterns support it.
- All session reads/writes must remain tenant-scoped.

### Location Isolation
Status: Compatible but must be explicit
- Existing platform patterns support it.
- All session reads/writes must remain location-scoped.

### RBAC
Status: Platform exists, feature policy missing
- Existing auth middleware and `TenantUser.role` are available.
- Feature-specific policy enforcement must still be added.

### Audit Integration
Status: Blocking requirement for production readiness
- FIS-001 explicitly requires auditable significant actions.
- No reusable persistent Dining audit path was confirmed in the current implementation.

## Conflicts and Clarifications

### No Direct Conflict With FIS-000
FIS-001 does not redefine Menu Engine rules.
It introduces the Session Aggregate as a new root for later Dining features.

### Architectural Gap Requiring Clarification Before Code
The largest unresolved dependency is table identity.
FIS-001 assumes `tableId` and one active session per table, but the current codebase does not contain a Table domain, schema, or canonical table status engine.

Recommendation:
- Treat `tableId` as an external required identifier in FIS-001 implementation.
- Do not invent full table lifecycle behavior yet because FIS-003 owns that area.
- Implement only the minimum table reference and active-session uniqueness constraint needed by FIS-001.

### Audit Framework Gap
FIS-001 requires persistent audit integration, but no approved shared audit framework was identified.

Recommendation:
- Either confirm an existing platform audit destination before implementation begins,
- or explicitly approve a minimal Dining-specific audit persistence approach.

Without that clarification, a full production-complete FIS-001 cannot be claimed.

## Implemented / Partial / Missing / Conflicting / Technical Debt Matrix

### Implemented
- None for Session Engine itself.

### Partially Implemented
- tenant isolation platform support
- location isolation platform support
- auth middleware support
- role-carrying user model support
- shared API response contract support
- JSON-column precedent in Prisma schema
- versioned entity precedent in Dining Menu schema

### Missing
- session aggregate
- session entities
- session contracts
- session schema
- session repositories
- session services
- session controllers/routes
- session DTOs
- session tests
- session event contracts
- timeline persistence
- audit persistence
- active-session-per-table database constraint
- waiter assignment history persistence

### Conflicting
- None requiring implementation stop today.
- Two unresolved prerequisites remain: table identity strategy and audit persistence target.

### Technical Debt Relevant Before Starting FIS-001
- FIS-000 Menu controller still contains business logic and should not be copied into Session implementation.
- FIS-000 API base path is still not normalized to its FIS baseline.
- Logging-only event publisher exists and should not be reused as final audit behavior.

## Readiness Assessment
Overall readiness: Partially ready for implementation planning, not ready for coding sign-off yet.

Why not ready yet:
1. Table reference strategy is undefined in current platform.
2. Persistent audit integration target is undefined.
3. No approved session event contract file exists yet.
4. No explicit RBAC policy matrix has been translated into code-level permission rules.

What is ready:
- architecture pattern
- layering approach
- tenant/location isolation approach
- API envelope reuse
- domain-core contract packaging pattern
- hardening/test strategy pattern

## Recommended Next Step
Before implementation begins, confirm these two design decisions:
1. What is the canonical source of `tableId` before FIS-003 exists?
2. What persistent audit mechanism should Session Engine use?

Once those are confirmed, the next safe step is:
- create the FIS-001 implementation baseline document entry
- then implement the Session aggregate incrementally using the same staged approach used for FIS-000
