import { prisma } from '@saas/database';
import type {
  SessionParticipantRole,
  SessionParticipantStatus,
  SessionTokenStatus,
} from '@saas/domain-core/dining/session.contract';
import type {
  SessionParticipantCreateInput,
  SessionParticipantRecord,
  SessionTokenRecord,
  SessionTokenRepository,
  SessionTokenUpsertInput,
} from '../../application/contracts/session-token.repository';

type SessionTokenDelegate = {
  findFirst(args: unknown): Promise<any | null>;
  create(args: unknown): Promise<any>;
  update(args: unknown): Promise<any>;
  updateMany(args: unknown): Promise<any>;
  findMany(args: unknown): Promise<any[]>;
  count(args: unknown): Promise<number>;
};

type SessionParticipantDelegate = {
  findFirst(args: unknown): Promise<any | null>;
  create(args: unknown): Promise<any>;
  update(args: unknown): Promise<any>;
  updateMany(args: unknown): Promise<any>;
  findMany(args: unknown): Promise<any[]>;
  count(args: unknown): Promise<number>;
};

type SessionDelegate = {
  findFirst(args: unknown): Promise<any | null>;
};

type DiningSessionDelegates = {
  sessionToken: SessionTokenDelegate;
  sessionParticipant: SessionParticipantDelegate;
  diningSession: SessionDelegate;
};

function delegates(client: unknown): DiningSessionDelegates {
  return client as DiningSessionDelegates;
}

function mapToken(record: any): SessionTokenRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    sessionId: record.sessionId,
    token: record.token,
    status: record.status,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
    createdBy: record.createdBy,
    lastAccessedAt: record.lastAccessedAt,
    regeneratedAt: record.regeneratedAt,
  };
}

function mapParticipant(record: any): SessionParticipantRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    sessionId: record.sessionId,
    role: record.role,
    participantType: record.participantType,
    displayName: record.displayName,
    deviceId: record.deviceId,
    status: record.status,
    permissions: Array.isArray(record.permissions) ? record.permissions : null,
    joinedBy: record.joinedBy,
    joinedAt: record.joinedAt,
    leftAt: record.leftAt,
    lastSeenAt: record.lastSeenAt,
    actorId: record.actorId,
  };
}

export class PrismaSessionTokenRepository implements SessionTokenRepository {
  async findBySession(sessionId: string, tenantId: string, locationId: string): Promise<SessionTokenRecord | null> {
    const db = delegates(prisma);

    const record = await db.sessionToken.findFirst({
      where: {
        sessionId,
        tenantId,
        locationId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return record ? mapToken(record) : null;
  }

  async findByToken(token: string, tenantId: string, locationId: string): Promise<SessionTokenRecord | null> {
    const db = delegates(prisma);

    const record = await db.sessionToken.findFirst({
      where: {
        token,
        tenantId,
        locationId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return record ? mapToken(record) : null;
  }

  async isTokenValueInUse(token: string): Promise<boolean> {
    const db = delegates(prisma);
    const count = await db.sessionToken.count({ where: { token } });
    return count > 0;
  }

  async upsertToken(input: SessionTokenUpsertInput): Promise<SessionTokenRecord> {
    const db = delegates(prisma);

    if (input.id) {
      const updated = await db.sessionToken.update({
        where: { id: input.id },
        data: {
          token: input.token,
          status: input.status,
          expiresAt: input.expiresAt,
          lastAccessedAt: input.lastAccessedAt ?? null,
          regeneratedAt: input.regeneratedAt ?? null,
        },
      });
      return mapToken(updated);
    }

    const created = await db.sessionToken.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        sessionId: input.sessionId,
        token: input.token,
        status: input.status,
        expiresAt: input.expiresAt,
        createdBy: input.createdBy ?? null,
        lastAccessedAt: input.lastAccessedAt ?? null,
        regeneratedAt: input.regeneratedAt ?? null,
      },
    });

    return mapToken(created);
  }

  async updateTokenStatus(
    tokenId: string,
    tenantId: string,
    locationId: string,
    status: SessionTokenStatus,
    lastAccessedAt?: Date | null,
  ): Promise<void> {
    const db = delegates(prisma);

    await db.sessionToken.updateMany({
      where: {
        id: tokenId,
        tenantId,
        locationId,
      },
      data: {
        status,
        lastAccessedAt: lastAccessedAt ?? null,
      },
    });
  }

  async touchTokenAccess(tokenId: string, tenantId: string, locationId: string, lastAccessedAt: Date): Promise<void> {
    const db = delegates(prisma);

    await db.sessionToken.updateMany({
      where: {
        id: tokenId,
        tenantId,
        locationId,
      },
      data: {
        lastAccessedAt,
      },
    });
  }

  async findParticipantByDevice(
    sessionId: string,
    tenantId: string,
    locationId: string,
    deviceId: string,
    role: SessionParticipantRole,
  ): Promise<SessionParticipantRecord | null> {
    const db = delegates(prisma);

    const record = await db.sessionParticipant.findFirst({
      where: {
        sessionId,
        tenantId,
        locationId,
        deviceId,
        role,
      },
      orderBy: { joinedAt: 'desc' },
    });

    return record ? mapParticipant(record) : null;
  }

  async countActiveParticipants(sessionId: string, tenantId: string, locationId: string): Promise<number> {
    const db = delegates(prisma);

    return db.sessionParticipant.count({
      where: {
        sessionId,
        tenantId,
        locationId,
        status: {
          in: ['JOINING', 'ACTIVE', 'IDLE', 'DISCONNECTED'],
        },
      },
    });
  }

  async createParticipant(input: SessionParticipantCreateInput): Promise<SessionParticipantRecord> {
    const db = delegates(prisma);

    const created = await db.sessionParticipant.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        sessionId: input.sessionId,
        role: input.role,
        participantType: input.participantType ?? input.role,
        displayName: input.displayName ?? null,
        deviceId: input.deviceId,
        status: input.status,
        permissions: input.permissions ?? [],
        joinedBy: input.joinedBy ?? null,
        joinedAt: input.joinedAt,
        leftAt: null,
        lastSeenAt: input.lastSeenAt,
        actorId: input.actorId ?? null,
      },
    });

    return mapParticipant(created);
  }

  async updateParticipantStatus(
    participantId: string,
    tenantId: string,
    locationId: string,
    status: SessionParticipantStatus,
    leftAt?: Date | null,
  ): Promise<SessionParticipantRecord | null> {
    const db = delegates(prisma);

    const record = await db.sessionParticipant.findFirst({
      where: {
        id: participantId,
        tenantId,
        locationId,
      },
    });

    if (!record) {
      return null;
    }

    const updated = await db.sessionParticipant.update({
      where: { id: participantId },
      data: {
        status,
        leftAt: leftAt ?? null,
        lastSeenAt: new Date(),
      },
    });

    return mapParticipant(updated);
  }

  async touchParticipant(participantId: string, tenantId: string, locationId: string, lastSeenAt: Date): Promise<void> {
    const db = delegates(prisma);

    await db.sessionParticipant.updateMany({
      where: {
        id: participantId,
        tenantId,
        locationId,
      },
      data: {
        lastSeenAt,
      },
    });
  }

  async listParticipants(
    sessionId: string,
    tenantId: string,
    locationId: string,
    includeLeft = false,
  ): Promise<SessionParticipantRecord[]> {
    const db = delegates(prisma);

    const records = await db.sessionParticipant.findMany({
      where: {
        sessionId,
        tenantId,
        locationId,
        ...(includeLeft
          ? {}
          : {
              status: {
                not: 'LEFT',
              },
            }),
      },
      orderBy: { joinedAt: 'asc' },
    });

    return records.map(mapParticipant);
  }
}
