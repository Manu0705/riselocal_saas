import type { SessionStatus } from '@saas/domain-core/dining/session.contract';

export interface SessionStateSnapshot {
  exists: boolean;
  status: SessionStatus;
}

export interface SessionStateGateway {
  getSessionState(sessionId: string, tenantId: string, locationId: string): Promise<SessionStateSnapshot>;
}
