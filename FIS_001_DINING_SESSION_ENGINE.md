# RiseLocal DiningOS

# Feature Implementation Specification (FIS-001)

# Dining Session Engine
**Version:** 1.0
**Priority:** P0 (Foundation)
**Status:** Draft Specification
**Module:** DiningOS -> Session Domain
**Dependencies:** RiseLocal Platform (Tenant, Location, Users, RBAC, Audit, Notifications)

---

# 1. Feature Overview
The Dining Session Engine is the central domain of DiningOS.

Every dine-in experience, from seating a guest to closing the bill, is represented by exactly one Dining Session.

A Dining Session acts as the shared operational workspace for customers, waiters, kitchen staff, cashiers, and managers.

It owns all collaborative activities that occur during a customer's visit, including participants, cart, order rounds, billing, payments, and audit history.

The Dining Session is the Aggregate Root of DiningOS.

---

# 2. Business Objective
Replace fragmented restaurant workflows with a single, authoritative session that coordinates all actors involved in a dining experience.

The system must ensure:

- Every occupied table has at most one active session.
- Every participant works on the same live data.
- Every order belongs to a session.
- Every payment settles a session.
- Every significant action is attributable and auditable.

---

# 3. Scope

## Included in P0

- Session creation
- Session lifecycle
- Session ownership
- Session metadata
- Participant management
- Active waiter assignment
- Session reopening (authorized)
- Session archival
- Versioning
- Event publication
- Audit integration

## Out of Scope
Handled by later FIS documents:

- QR/token joining (FIS-002)
- Shared cart (FIS-004)
- Orders (FIS-005)
- Billing (FIS-013)
- Payments (FIS-013)
- Session closure validation (FIS-014)

---

# 4. Actors
| Actor | Responsibility |
|---|---|
| Reception | Opens session when seating guests |
| Waiter | Owns and manages active session |
| Customer | Participates in session |
| Kitchen Staff | Reads submitted orders |
| Cashier | Completes payment |
| Manager | Performs privileged actions |
| Owner | Reporting only |
| Super Admin | Platform support |

---

# 5. Aggregate Boundary
The Dining Session owns the following entities.

```text
Dining Session

├── Participants
├── Cart
├── Order Rounds
├── Orders
├── Bills
├── Payments
├── Timeline
├── Audit References
└── Events
```

Nothing inside the aggregate may exist without a parent Dining Session.

---

# 6. Core Entity

```text
DiningSession {
  id: UUID
  tenantId: UUID
  locationId: UUID
  tableId: UUID
  status: SessionStatus
  openedBy: UUID
  openedAt: Timestamp
  closedBy?: UUID
  closedAt?: Timestamp
  assignedWaiterId?: UUID
  guestCount: number
  currentRound: number
  participantCount: number
  version: number
  metadata: JSON
}
```

## Required Fields
| Field | Description |
|---|---|
| tenantId | Business owner |
| locationId | Physical outlet |
| tableId | Current table |
| openedBy | Staff who created session |
| status | Current lifecycle state |
| version | Optimistic concurrency |
| guestCount | Current guest count |

---

# 7. Domain Invariants
These rules may never be violated.

### Invariant 1
One table may have only one active Dining Session.

### Invariant 2
Every Dining Session belongs to exactly one tenant.

### Invariant 3
A session always belongs to one location.

### Invariant 4
Every order belongs to exactly one session.

### Invariant 5
Every participant belongs to exactly one active session.

### Invariant 6
Closed sessions are immutable except through authorized administrative operations.

### Invariant 7
A session version increases on every successful state mutation.

---

# 8. Session Lifecycle

```text
Created
  ↓
Seated
  ↓
Active
  ↓
Ordering
  ↓
Dining
  ↓
Billing
  ↓
Completed
  ↓
Closed
  ↓
Archived
```

## State Definitions

### Created
Session exists but guests are not yet seated.

### Seated
Guests occupy table.
No orders yet.

### Active
Session ready for collaboration.

### Ordering
Cart and orders actively changing.

### Dining
Orders are being served.

### Billing
Payment requested.
Order modifications restricted.

### Completed
Payment successful.
Waiting for final closure.

### Closed
Operationally complete.
No further mutations permitted.

### Archived
Historical record.
Reporting only.

---

# 9. Session Metadata
Session stores operational context.

Examples:

```json
{
  "occasion": "Birthday",
  "notes": "Window seat requested",
  "language": "en",
  "source": "Walk-in"
}
```

Metadata must remain extensible.

---

# 10. Session Timeline
Every session maintains a chronological timeline.

Example:

```text
18:02 Session Created
18:05 Guests Seated
18:09 Waiter Assigned
18:15 Order Submitted
18:23 Kitchen Accepted
18:37 Food Served
19:10 Bill Requested
19:16 Payment Completed
19:18 Session Closed
```

Timeline entries are append-only.

---

# 11. Participant Model
A session contains multiple participants.

```text
Dining Session
  ↓
Participants
├── Customer
├── Customer
├── Waiter
├── Manager
```

Participant roles are defined in FIS-002.

---

# 12. Session Ownership Rules
Session ownership follows:

```text
Tenant
  ↓
Location
  ↓
Table
  ↓
Dining Session
```

A session may move to another table only through an authorized Table Transfer operation (FIS-009).

---

# 13. Database Design
Primary table:

```text
dining_sessions
-----------------------
id
tenant_id
location_id
table_id
status
opened_by
opened_at
closed_by
closed_at
assigned_waiter_id
guest_count
current_round
participant_count
version
metadata
created_at
updated_at
created_by
updated_by
deleted_at
```

Indexes:

```text
tenant_id
location_id
table_id
status
opened_at
```

Unique constraint:

```text
(table_id, active_session)
```

Ensures only one active session per table.

---

# 14. API Design
Base

```text
/api/v1/dining/sessions
```

Endpoints:

### Create Session
```text
POST /
```

### Get Session
```text
GET /:id
```

### Get Active Session
```text
GET /table/:tableId
```

### Assign Waiter
```text
PATCH /:id/waiter
```

### Update Guest Count
```text
PATCH /:id/guest-count
```

### Change Status
```text
PATCH /:id/status
```

### Close Session
```text
POST /:id/close
```

Validation rules for closure are defined in FIS-014.

---

# 15. Domain Events
The Session Engine publishes events.

### SessionCreated
```json
{
  "sessionId": "...",
  "tableId": "...",
  "tenantId": "..."
}
```

### SessionActivated

### WaiterAssigned

### GuestCountUpdated

### SessionStatusChanged

### SessionClosed

### SessionArchived

Consumers include:

- Table Engine
- Shared Cart
- Kitchen
- Billing
- Analytics
- Audit
- Notifications

---

# 16. Business Rules

### Rule 1
Creating a session automatically occupies the table.

### Rule 2
Closing a session releases the table only after Table Engine validation.

### Rule 3
Guest count may increase or decrease while the session is active.

### Rule 4
A waiter assignment replaces the previous assignment while preserving history.

### Rule 5
Historical sessions are never permanently deleted.

### Rule 6
Session IDs are immutable.

### Rule 7
Every mutation increments the session version.

---

# 17. Permissions
| Action | Reception | Waiter | Manager | Owner |
|---|---|---|---|---|
| Create Session | ✓ | ✓ | ✓ | ✓ |
| Assign Waiter | ✓ | Limited | ✓ | ✓ |
| Update Guests | ✓ | ✓ | ✓ | ✓ |
| Close Session | ✗ | Limited | ✓ | ✓ |
| Archive Session | ✗ | ✗ | ✓ | ✓ |

---

# 18. Failure & Recovery
The engine must recover safely from:

- Duplicate create requests
- Browser refreshes
- Temporary network loss
- Concurrent updates
- Backend retries
- Partial transaction failures

Session creation and status transitions must be idempotent where applicable.

---

# 19. Edge Cases

### Guests Leave Without Paying
Session enters Billing state and requires manager override or payment before closure.

### Waiter Ends Shift
Session must be reassigned before further waiter actions.

### Table Reopened
Creates a new session.
Historical session remains unchanged.

### Device Offline
Device must reload the authoritative session state after reconnection.

### Duplicate Create Request
The API must return the existing active session rather than creating another.

---

# 20. Testing Requirements

## Unit Tests
- Lifecycle transitions
- Aggregate invariants
- Guest count rules
- Version increments
- Waiter assignment

## Integration Tests
- Session creation
- Active session lookup
- Concurrent updates
- Authorization checks

## End-to-End Tests
```text
Seat Guests
  ↓
Create Session
  ↓
Assign Waiter
  ↓
Update Guests
  ↓
Close Session
```

Verify timeline, audit entries, and emitted events.

---

# 21. Acceptance Criteria
The Dining Session Engine is complete when:

- Exactly one active session can exist per table.
- Session lifecycle follows defined state transitions.
- All sessions are tenant and location isolated.
- Session versioning supports optimistic concurrency.
- Timeline entries are recorded for every significant action.
- Waiter assignment history is preserved.
- Session events are published consistently.
- Unauthorized mutations are rejected.
- Closed sessions are immutable.
- All sensitive operations are audited.
- Database constraints prevent duplicate active sessions.
- APIs are idempotent where required.

---

# 22. Dependencies
Provides the foundation for:

```text
FIS-002  Session Token & Secure Joining
        ↓
FIS-003  Table Status Engine
        ↓
FIS-004  Shared Cart Engine
        ↓
FIS-005  Multiple Order Rounds
        ↓
FIS-006  Waiter Assisted Ordering
        ↓
FIS-009  Table Transfer
        ↓
FIS-013 Billing & Payment
```

This FIS establishes the canonical Session Aggregate. Every subsequent DiningOS feature should extend this aggregate rather than redefining session behavior.
