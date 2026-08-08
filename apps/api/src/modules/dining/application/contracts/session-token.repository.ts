import type {
  SessionParticipantRole,
  SessionParticipantStatus,
  SessionStatus,
  SessionTokenStatus,
} from '@saas/domain-core/dining/session.contract';

export interface SessionTokenRecord {
  id: string;
  tenantId: string;
  locationId: string;
  sessionId: string;
  token: string;
  status: SessionTokenStatus;
  expiresAt: Date;
  createdAt: Date;
  createdBy?: string | null;
  lastAccessedAt?: Date | null;
  regeneratedAt?: Date | null;
}

export interface SessionParticipantRecord {
  id: string;
  tenantId: string;
  locationId: string;
  sessionId: string;
  role: SessionParticipantRole;
  participantType?: SessionParticipantRole;
  displayName?: string | null;
  deviceId: string;
  status: SessionParticipantStatus;
  permissions?: string[] | null;
  joinedBy?: string | null;
  joinedAt: Date;
  leftAt?: Date | null;
  lastSeenAt: Date;
  actorId?: string | null;
}

export interface SessionTokenUpsertInput {
  id?: string;
  tenantId: string;
  locationId: string;
  sessionId: string;
  token: string;
  status: SessionTokenStatus;
  expiresAt: Date;
  createdBy?: string | null;
  lastAccessedAt?: Date | null;
  regeneratedAt?: Date | null;
}

export interface SessionParticipantCreateInput {
  tenantId: string;
  locationId: string;
  sessionId: string;
  role: SessionParticipantRole;
  participantType?: SessionParticipantRole;
  displayName?: string | null;
  deviceId: string;
  status: SessionParticipantStatus;
  permissions?: string[];
  joinedBy?: string | null;
  joinedAt: Date;
  lastSeenAt: Date;
  actorId?: string | null;
}

export interface SessionStateReference {
  sessionId: string;
  tenantId: string;
  locationId: string;
  status: SessionStatus;
}

export interface SessionTokenRepository {
  findBySession(sessionId: string, tenantId: string, locationId: string): Promise<SessionTokenRecord | null>;
  findByToken(token: string, tenantId: string, locationId: string): Promise<SessionTokenRecord | null>;
  isTokenValueInUse(token: string): Promise<boolean>;
  upsertToken(input: SessionTokenUpsertInput): Promise<SessionTokenRecord>;
  updateTokenStatus(
    tokenId: string,
    tenantId: string,
    locationId: string,
    status: SessionTokenStatus,
    lastAccessedAt?: Date | null,
  ): Promise<void>;
  touchTokenAccess(tokenId: string, tenantId: string, locationId: string, lastAccessedAt: Date): Promise<void>;
  findParticipantByDevice(
    sessionId: string,
    tenantId: string,
    locationId: string,
    deviceId: string,
    role: SessionParticipantRole,
  ): Promise<SessionParticipantRecord | null>;
  countActiveParticipants(sessionId: string, tenantId: string, locationId: string): Promise<number>;
  createParticipant(input: SessionParticipantCreateInput): Promise<SessionParticipantRecord>;
  updateParticipantStatus(
    participantId: string,
    tenantId: string,
    locationId: string,
    status: SessionParticipantStatus,
    leftAt?: Date | null,
  ): Promise<SessionParticipantRecord | null>;
  touchParticipant(participantId: string, tenantId: string, locationId: string, lastSeenAt: Date): Promise<void>;
  listParticipants(
    sessionId: string,
    tenantId: string,
    locationId: string,
    includeLeft?: boolean,
  ): Promise<SessionParticipantRecord[]>;
}
