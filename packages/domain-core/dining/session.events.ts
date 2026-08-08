import type { SessionStatus } from './session.contract';

export interface SessionCreated {
  sessionId: string;
  tableId: string;
  tenantId: string;
  locationId: string;
}

export interface SessionActivated {
  sessionId: string;
  tenantId: string;
  locationId: string;
}

export interface WaiterAssigned {
  sessionId: string;
  tenantId: string;
  locationId: string;
  waiterId: string;
  assignedBy?: string | null;
  previousWaiterId?: string | null;
}

export interface GuestCountUpdated {
  sessionId: string;
  tenantId: string;
  locationId: string;
  previousGuestCount: number;
  nextGuestCount: number;
  changedBy?: string | null;
}

export interface SessionStatusChanged {
  sessionId: string;
  tenantId: string;
  locationId: string;
  previousStatus: SessionStatus;
  nextStatus: SessionStatus;
  changedBy?: string | null;
}

export interface SessionClosed {
  sessionId: string;
  tableId: string;
  tenantId: string;
  locationId: string;
  closedBy?: string | null;
}

export interface SessionArchived {
  sessionId: string;
  tableId: string;
  tenantId: string;
  locationId: string;
  archivedBy?: string | null;
}

export interface SessionTokenGenerated {
  sessionId: string;
  tenantId: string;
  locationId: string;
  tokenId: string;
}

export interface SessionTokenRegenerated {
  sessionId: string;
  tenantId: string;
  locationId: string;
  tokenId: string;
}

export interface ParticipantJoined {
  sessionId: string;
  tenantId: string;
  locationId: string;
  participantId: string;
  deviceId: string;
  role: string;
}

export interface ParticipantDisconnected {
  sessionId: string;
  tenantId: string;
  locationId: string;
  participantId: string;
  deviceId: string;
  role: string;
}

export interface ParticipantReconnected {
  sessionId: string;
  tenantId: string;
  locationId: string;
  participantId: string;
  deviceId: string;
  role: string;
}

export interface ParticipantLeft {
  sessionId: string;
  tenantId: string;
  locationId: string;
  participantId: string;
  deviceId: string;
  role: string;
}

export interface SessionTokenExpired {
  sessionId: string;
  tenantId: string;
  locationId: string;
  tokenId: string;
}
