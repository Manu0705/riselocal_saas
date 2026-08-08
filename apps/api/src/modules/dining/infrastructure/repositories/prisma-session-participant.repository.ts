import { prisma } from '@saas/database';
import {
  normalizeSessionParticipantRole,
  normalizeSessionParticipantStatus,
} from '@saas/domain-core/dining/session.validation';
import type {
  DiningSessionSummaryRecord,
  SessionParticipantCreateInput,
  SessionParticipantRecord,
  SessionParticipantRepository,
} from '../../application/contracts/session-participant.repository';

type SessionParticipantDelegate = {
  findFirst(args: unknown): Promise<any | null>;
  create(args: unknown): Promise<any>;
  update(args: unknown): Promise<any>;
  findMany(args: unknown): Promise<any[]>;
};

type DiningSessionDelegate = {
  findFirst(args: unknown): Promise<any | null>;
  updateMany(args: unknown): Promise<any>;
};

type Delegates = {
  sessionParticipant: SessionParticipantDelegate;
  diningSession: DiningSessionDelegate;
};

function delegates(client: unknown): Delegates {
  return client as Delegates;
}

function mapSession(record: any): DiningSessionSummaryRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    status: record.status,
    assignedWaiterId: record.assignedWaiterId ?? null,
  };
}

function mapParticipant(record: any): SessionParticipantRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    sessionId: record.sessionId,
    actorId: record.actorId ?? null,
    role: normalizeSessionParticipantRole(record.role),
    participantType: normalizeSessionParticipantRole(record.participantType),
    displayName: record.displayName ?? null,
    deviceId: record.deviceId,
    status: normalizeSessionParticipantStatus(record.status),
    permissions: Array.isArray(record.permissions) ? record.permissions.map((value: unknown) => String(value)) : [],
    joinedBy: record.joinedBy ?? null,
    joinedAt: record.joinedAt,
    leftAt: record.leftAt ?? null,
    lastSeenAt: record.lastSeenAt,
  };
}

export class PrismaSessionParticipantRepository implements SessionParticipantRepository {
  async findSessionById(sessionId: string, tenantId: string, locationId: string): Promise<DiningSessionSummaryRecord | null> {
    const db = delegates(prisma);

    const record = await db.diningSession.findFirst({
      where: {
        id: sessionId,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    return record ? mapSession(record) : null;
  }

  async findParticipantById(participantId: string, tenantId: string, locationId: string): Promise<SessionParticipantRecord | null> {
    const db = delegates(prisma);

    const record = await db.sessionParticipant.findFirst({
      where: {
        id: participantId,
        tenantId,
        locationId,
      },
    });

    return record ? mapParticipant(record) : null;
  }

  async findActiveParticipantByActor(
    sessionId: string,
    tenantId: string,
    locationId: string,
    actorId: string,
    participantType: string,
  ): Promise<SessionParticipantRecord | null> {
    const db = delegates(prisma);

    const record = await db.sessionParticipant.findFirst({
      where: {
        sessionId,
        tenantId,
        locationId,
        actorId,
        participantType,
        status: {
          in: ['JOINING', 'ACTIVE', 'IDLE', 'DISCONNECTED'],
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return record ? mapParticipant(record) : null;
  }

  async createParticipant(input: SessionParticipantCreateInput): Promise<SessionParticipantRecord> {
    const db = delegates(prisma);

    const created = await db.sessionParticipant.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        sessionId: input.sessionId,
        actorId: input.actorId,
        role: input.role,
        participantType: input.participantType,
        displayName: input.displayName ?? null,
        deviceId: input.deviceId,
        status: input.status,
        permissions: input.permissions,
        joinedBy: input.joinedBy ?? null,
        joinedAt: input.joinedAt,
        leftAt: null,
        lastSeenAt: input.lastSeenAt,
      },
    });

    return mapParticipant(created);
  }

  async updateParticipantStatus(
    participantId: string,
    tenantId: string,
    locationId: string,
    status: string,
    leftAt: Date,
  ): Promise<SessionParticipantRecord | null> {
    const db = delegates(prisma);

    const existing = await db.sessionParticipant.findFirst({
      where: {
        id: participantId,
        tenantId,
        locationId,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await db.sessionParticipant.update({
      where: { id: participantId },
      data: {
        status,
        leftAt,
        lastSeenAt: leftAt,
      },
    });

    return mapParticipant(updated);
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
        ...(includeLeft ? {} : { status: { notIn: ['LEFT', 'REMOVED'] } }),
      },
      orderBy: { joinedAt: 'asc' },
    });

    return records.map(mapParticipant);
  }

  async assignWaiter(
    sessionId: string,
    tenantId: string,
    locationId: string,
    waiterId: string,
    updatedBy?: string | null,
  ): Promise<DiningSessionSummaryRecord | null> {
    const db = delegates(prisma);

    const existing = await db.diningSession.findFirst({
      where: {
        id: sessionId,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    await db.diningSession.updateMany({
      where: {
        id: sessionId,
        tenantId,
        locationId,
      },
      data: {
        assignedWaiterId: waiterId,
        updatedBy: updatedBy ?? null,
      },
    });

    const updated = await db.diningSession.findFirst({
      where: {
        id: sessionId,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    return updated ? mapSession(updated) : null;
  }
}
