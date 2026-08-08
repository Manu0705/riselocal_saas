import { prisma } from '@saas/database';
import type { TableCreateInput, TableRecord, TableRepository, TableUpdateInput } from '../../application/contracts/table.repository';

type TableDelegate = {
  create(args: unknown): Promise<any>;
  updateMany(args: unknown): Promise<any>;
  findFirst(args: unknown): Promise<any | null>;
  findMany(args: unknown): Promise<any[]>;
};

type DiningTableDelegates = {
  diningTable: TableDelegate;
};

function delegates(client: unknown): DiningTableDelegates {
  return client as DiningTableDelegates;
}

export class PrismaTableRepository implements TableRepository {
  async findById(id: string, tenantId: string, locationId: string): Promise<TableRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningTable.findFirst({
      where: {
        id,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    return record ? this.mapRecord(record) : null;
  }

  async findAllByLocation(tenantId: string, locationId: string, status?: string): Promise<TableRecord[]> {
    const db = delegates(prisma);
    const records = await db.diningTable.findMany({
      where: {
        tenantId,
        locationId,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      orderBy: [{ areaId: 'asc' }, { name: 'asc' }],
    });

    return records.map((record: unknown) => this.mapRecord(record));
  }

  async findByActiveSessionId(sessionId: string, tenantId: string, locationId: string): Promise<TableRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningTable.findFirst({
      where: {
        activeSessionId: sessionId,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    return record ? this.mapRecord(record) : null;
  }

  async createTable(input: TableCreateInput): Promise<TableRecord> {
    const db = delegates(prisma);
    const created = await db.diningTable.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        areaId: input.areaId,
        name: input.name,
        capacity: input.capacity,
        status: input.status ?? 'AVAILABLE',
        activeSessionId: input.activeSessionId ?? null,
        currentWaiterId: input.currentWaiterId ?? null,
        lastStatusChangedAt: input.lastStatusChangedAt ?? new Date(),
        lastStatusChangedBy: input.lastStatusChangedBy,
        version: input.version ?? 0,
        createdBy: input.createdBy ?? null,
        updatedBy: input.updatedBy ?? null,
      },
    });

    return this.mapRecord(created);
  }

  async updateTable(input: TableUpdateInput): Promise<TableRecord | null> {
    const now = new Date();
    const db = delegates(prisma);

    const result = await db.diningTable.updateMany({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        locationId: input.locationId,
        deletedAt: null,
        version: input.expectedVersion,
      },
      data: {
        ...(typeof input.status === 'string' ? { status: input.status } : {}),
        ...(input.activeSessionId !== undefined ? { activeSessionId: input.activeSessionId } : {}),
        ...(input.currentWaiterId !== undefined ? { currentWaiterId: input.currentWaiterId } : {}),
        lastStatusChangedAt: input.lastStatusChangedAt ?? now,
        ...(input.lastStatusChangedBy ? { lastStatusChangedBy: input.lastStatusChangedBy } : {}),
        updatedBy: input.updatedBy ?? null,
        updatedAt: now,
        version: { increment: 1 },
      },
    });

    if (!result || result.count === 0) {
      return null;
    }

    const record = await db.diningTable.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        locationId: input.locationId,
        deletedAt: null,
      },
    });

    return record ? this.mapRecord(record) : null;
  }

  private mapRecord(record: any): TableRecord {
    return {
      ...record,
      capacity: Number(record.capacity),
      version: Number(record.version ?? 0),
    };
  }
}