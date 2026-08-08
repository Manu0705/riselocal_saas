import type {
  SessionParticipantRole,
  SessionParticipantStatus,
  SessionStatus,
} from '@saas/domain-core/dining/session.contract';

export interface DiningSessionSummaryRecord {
  id: string;
  tenantId: string;
  locationId: string;
  status: SessionStatus;
  assignedWaiterId?: string | null;
}

export interface SessionParticipantRecord {
  id: string;
  tenantId: string;
  locationId: string;
  sessionId: string;
  actorId?: string | null;
  role: SessionParticipantRole;
  participantType: SessionParticipantRole;
  displayName?: string | null;
  deviceId: string;
  status: SessionParticipantStatus;
  permissions: string[];
  joinedBy?: string | null;
  joinedAt: Date;
  leftAt?: Date | null;
  lastSeenAt: Date;
}

export interface SessionParticipantCreateInput {
  tenantId: string;
  locationId: string;
  sessionId: string;
  actorId: string;
  role: SessionParticipantRole;
  participantType: SessionParticipantRole;
  displayName?: string | null;
  deviceId: string;
  status: SessionParticipantStatus;
  permissions: string[];
  joinedBy?: string | null;
  joinedAt: Date;
  lastSeenAt: Date;
}

export interface SessionParticipantRepository {
  findSessionById(sessionId: string, tenantId: string, locationId: string): Promise<DiningSessionSummaryRecord | null>;
  findParticipantById(participantId: string, tenantId: string, locationId: string): Promise<SessionParticipantRecord | null>;
  findActiveParticipantByActor(
    sessionId: string,
    tenantId: string,
    locationId: string,
    actorId: string,
    participantType: SessionParticipantRole,
  ): Promise<SessionParticipantRecord | null>;
  createParticipant(input: SessionParticipantCreateInput): Promise<SessionParticipantRecord>;
  updateParticipantStatus(
    participantId: string,
    tenantId: string,
    locationId: string,
    status: SessionParticipantStatus,
    leftAt: Date,
  ): Promise<SessionParticipantRecord | null>;
  listParticipants(
    sessionId: string,
    tenantId: string,
    locationId: string,
    includeLeft?: boolean,
  ): Promise<SessionParticipantRecord[]>;
  assignWaiter(
    sessionId: string,
    tenantId: string,
    locationId: string,
    waiterId: string,
    updatedBy?: string | null,
  ): Promise<DiningSessionSummaryRecord | null>;
}
