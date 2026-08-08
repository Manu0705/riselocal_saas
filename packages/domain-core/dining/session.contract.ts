export type SessionStatus =
  | 'CREATED'
  | 'SEATED'
  | 'ACTIVE'
  | 'ORDERING'
  | 'DINING'
  | 'BILLING'
  | 'COMPLETED'
  | 'CLOSED'
  | 'ARCHIVED';

export type SessionTokenStatus = 'GENERATED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export type SessionParticipantRole = 'CUSTOMER' | 'WAITER' | 'MANAGER' | 'CASHIER' | 'OBSERVER';

export type SessionParticipantStatus = 'JOINING' | 'ACTIVE' | 'IDLE' | 'DISCONNECTED' | 'LEFT' | 'REMOVED';

// Keep identifier compatibility for FIS-001 while exposing FIS-002 canonical roles.
export type SessionParticipantRoleIdentifier = SessionParticipantRole | string;
