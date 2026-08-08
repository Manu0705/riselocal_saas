import type { SessionParticipantRole } from '@saas/domain-core/dining/session.contract';

export interface SessionTokenRequestContextDTO {
  tenantId: string;
  locationId: string;
  actorId: string | null;
}

export interface GenerateSessionTokenRequestDTO {
  sessionId: string;
  expiresAt?: string;
  joinBaseUrl?: string;
}

export interface ValidateSessionTokenRequestDTO {
  token: string;
}

export interface JoinSessionRequestDTO {
  token: string;
  role: SessionParticipantRole | string;
  deviceId: string;
  displayName?: string | null;
}

export interface LeaveSessionRequestDTO {
  token: string;
  role: SessionParticipantRole | string;
  deviceId: string;
}

export interface RegenerateSessionTokenRequestDTO {
  sessionId: string;
  expiresAt?: string;
  joinBaseUrl?: string;
}

export interface GetParticipantsRequestDTO {
  sessionId: string;
  includeLeft?: boolean;
}
