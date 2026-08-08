import { prisma } from '@saas/database';
import type { SessionStatus } from '@saas/domain-core/dining/session.contract';
import type {
  SessionStateGateway,
  SessionStateSnapshot,
} from '../../application/contracts/session-state.gateway';

type SessionDelegate = {
  findFirst(args: unknown): Promise<any | null>;
};

type SessionDelegates = {
  diningSession: SessionDelegate;
};

function delegates(client: unknown): SessionDelegates {
  return client as SessionDelegates;
}

export class PrismaSessionStateGateway implements SessionStateGateway {
  async getSessionState(sessionId: string, tenantId: string, locationId: string): Promise<SessionStateSnapshot> {
    const db = delegates(prisma);

    const record = await db.diningSession.findFirst({
      where: {
        id: sessionId,
        tenantId,
        locationId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!record) {
      // FIS-001 session engine is still incremental; surface a stable "not found" state.
      return {
        exists: false,
        status: 'ARCHIVED',
      };
    }

    return {
      exists: true,
      status: record.status as SessionStatus,
    };
  }
}
