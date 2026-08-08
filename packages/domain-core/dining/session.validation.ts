import type {
  SessionParticipantRole,
  SessionParticipantStatus,
  SessionStatus,
  SessionTokenStatus,
} from './session.contract';

export const SESSION_ACTIVE_STATUSES: readonly SessionStatus[] = [
  'CREATED',
  'SEATED',
  'ACTIVE',
  'ORDERING',
  'DINING',
  'BILLING',
  'COMPLETED',
];

export const SESSION_ALLOWED_TRANSITIONS: Record<SessionStatus, readonly SessionStatus[]> = {
  CREATED: ['SEATED', 'ACTIVE', 'ARCHIVED'],
  SEATED: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['ORDERING', 'DINING', 'BILLING', 'CLOSED', 'ARCHIVED'],
  ORDERING: ['DINING', 'BILLING', 'CLOSED', 'ARCHIVED'],
  DINING: ['BILLING', 'COMPLETED', 'CLOSED', 'ARCHIVED'],
  BILLING: ['COMPLETED', 'CLOSED', 'ARCHIVED'],
  COMPLETED: ['CLOSED', 'ARCHIVED'],
  CLOSED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function isActiveSessionStatus(status: SessionStatus): boolean {
  return SESSION_ACTIVE_STATUSES.includes(status);
}

export function isClosedLikeSessionStatus(status: SessionStatus): boolean {
  return status === 'CLOSED' || status === 'ARCHIVED';
}

export function canTransitionSessionStatus(current: SessionStatus, next: SessionStatus): boolean {
  if (current === next) {
    return true;
  }

  return SESSION_ALLOWED_TRANSITIONS[current].includes(next);
}

export function isValidGuestCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export const SESSION_TOKEN_STATUSES: readonly SessionTokenStatus[] = ['GENERATED', 'ACTIVE', 'EXPIRED', 'REVOKED'];
export const SESSION_PARTICIPANT_ROLES: readonly SessionParticipantRole[] = [
  'CUSTOMER',
  'WAITER',
  'MANAGER',
  'CASHIER',
  'OBSERVER',
];
export const SESSION_PARTICIPANT_STATUSES: readonly SessionParticipantStatus[] = [
  'JOINING',
  'ACTIVE',
  'IDLE',
  'DISCONNECTED',
  'LEFT',
  'REMOVED',
];

export function normalizeSessionParticipantRole(value: unknown): SessionParticipantRole {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (SESSION_PARTICIPANT_ROLES.includes(normalized as SessionParticipantRole)) {
    return normalized as SessionParticipantRole;
  }

  return 'CUSTOMER';
}

export function normalizeSessionParticipantStatus(value: unknown): SessionParticipantStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (SESSION_PARTICIPANT_STATUSES.includes(normalized as SessionParticipantStatus)) {
    return normalized as SessionParticipantStatus;
  }

  return 'JOINING';
}

export function normalizeSessionTokenStatus(value: unknown): SessionTokenStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (SESSION_TOKEN_STATUSES.includes(normalized as SessionTokenStatus)) {
    return normalized as SessionTokenStatus;
  }

  return 'GENERATED';
}

export function isValidSessionToken(token: string): boolean {
  if (typeof token !== 'string') {
    return false;
  }

  return /^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2,4}$/.test(token.trim().toUpperCase());
}

export function isJoinableSessionStatus(status: SessionStatus): boolean {
  return !isClosedLikeSessionStatus(status);
}

export function isValidDeviceId(deviceId: string): boolean {
  if (typeof deviceId !== 'string') {
    return false;
  }

  const value = deviceId.trim();
  return value.length >= 6 && value.length <= 128;
}
