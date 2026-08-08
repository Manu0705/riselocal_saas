import type {
  SessionParticipantRole,
  SessionParticipantRoleIdentifier,
  SessionParticipantStatus,
  SessionStatus,
  SessionTokenStatus,
} from './session.contract';

export interface DiningSession {
  id: string;
  tenantId: string;
  locationId: string;
  tableId: string;
  status: SessionStatus;
  openedBy: string;
  openedAt: string | Date;
  closedBy?: string | null;
  closedAt?: string | Date | null;
  assignedWaiterId?: string | null;
  guestCount: number;
  currentRound: number;
  participantCount: number;
  version: number;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | Date | null;
}

export interface DiningSessionParticipant {
  id: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  actorId?: string | null;
  displayName?: string | null;
  roleIdentifier: SessionParticipantRoleIdentifier;
  role?: SessionParticipantRole;
  deviceId?: string;
  status?: SessionParticipantStatus;
  joinedAt?: string | Date;
  leftAt?: string | Date | null;
  lastSeenAt?: string | Date;
  metadata?: Record<string, unknown> | null;
}

export interface DiningSessionToken {
  id: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  token: string;
  status: SessionTokenStatus;
  expiresAt: string | Date;
  createdAt?: string | Date;
  createdBy?: string | null;
  lastAccessedAt?: string | Date | null;
  regeneratedAt?: string | Date | null;
}

export interface DiningSessionTimelineEntry {
  id: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  type: string;
  actorId?: string | null;
  timestamp?: string | Date;
  metadata?: Record<string, unknown> | null;
}

export interface DiningSessionAuditReference {
  id: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  action: string;
  actorId?: string | null;
  referenceType: string;
  referenceId: string;
  createdAt?: string | Date;
  metadata?: Record<string, unknown> | null;
}
