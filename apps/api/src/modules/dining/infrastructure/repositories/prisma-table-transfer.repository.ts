import { prisma } from '@saas/database';
import {
  normalizeTableAssignmentStatus,
  normalizeTableTransferStatus,
} from '@saas/domain-core/dining/table-transfer.validation';
import { normalizeTableStatus } from '@saas/domain-core/dining/table.validation';
import type {
  TableAssignment,
  TableTransferRequest,
} from '@saas/domain-core/dining/table-transfer.contract';
import type {
  CreateTableTransferInput,
  SessionSummaryRecord,
  TableSummaryRecord,
  TableTransferHistoryResult,
  TableTransferRepository,
  TransferExecutionInput,
  TransferExecutionResult,
  UpdateTableTransferStatusInput,
} from '../../application/contracts/table-transfer.repository';

type Delegate = {
  findFirst(args: unknown): Promise<any | null>;
  findMany(args: unknown): Promise<any[]>;
  create(args: unknown): Promise<any>;
  createMany(args: unknown): Promise<any>;
  update(args: unknown): Promise<any>;
  updateMany(args: unknown): Promise<any>;
};

type TransactionClient = {
  diningSession: Delegate;
  diningTable: Delegate;
  diningTableAssignment: Delegate;
  diningTableTransferRequest: Delegate;
};

type Delegates = TransactionClient & {
  $transaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T>;
};

function delegates(client: unknown): Delegates {
  return client as Delegates;
}

function mapSession(record: any): SessionSummaryRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    tableId: record.tableId,
    status: record.status,
    assignedWaiterId: record.assignedWaiterId ?? null,
    updatedBy: record.updatedBy ?? null,
  };
}

function mapTable(record: any): TableSummaryRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    status: normalizeTableStatus(record.status),
    activeSessionId: record.activeSessionId ?? null,
    currentWaiterId: record.currentWaiterId ?? null,
    lastStatusChangedBy: record.lastStatusChangedBy,
    version: Number(record.version ?? 0),
  };
}

function mapTransfer(record: any): TableTransferRequest {
  return {
    id: record.id,
    sessionId: record.sessionId,
    fromTableId: record.fromTableId,
    toTableId: record.toTableId,
    requestedBy: record.requestedBy,
    reason: record.reason,
    status: normalizeTableTransferStatus(record.status),
    approvedBy: record.approvedBy ?? null,
    createdAt: record.createdAt,
    completedAt: record.completedAt ?? null,
  };
}

function mapAssignment(record: any): TableAssignment {
  return {
    id: record.id,
    sessionId: record.sessionId,
    tableId: record.tableId,
    status: normalizeTableAssignmentStatus(record.status),
    assignedAt: record.assignedAt,
    releasedAt: record.releasedAt ?? null,
    assignedBy: record.assignedBy,
  };
}

export class PrismaTableTransferRepository implements TableTransferRepository {
  async findSessionById(sessionId: string, tenantId: string, locationId: string): Promise<SessionSummaryRecord | null> {
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

  async findTableById(tableId: string, tenantId: string, locationId: string): Promise<TableSummaryRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningTable.findFirst({
      where: {
        id: tableId,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    return record ? mapTable(record) : null;
  }

  async findTransferById(transferId: string, tenantId: string, locationId: string): Promise<TableTransferRequest | null> {
    const db = delegates(prisma);
    const record = await db.diningTableTransferRequest.findFirst({
      where: {
        id: transferId,
        tenantId,
        locationId,
      },
    });

    return record ? mapTransfer(record) : null;
  }

  async createTransferRequest(input: CreateTableTransferInput): Promise<TableTransferRequest> {
    const db = delegates(prisma);
    const created = await db.diningTableTransferRequest.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        sessionId: input.sessionId,
        fromTableId: input.fromTableId,
        toTableId: input.toTableId,
        requestedBy: input.requestedBy,
        reason: input.reason,
        status: 'REQUESTED',
      },
    });

    return mapTransfer(created);
  }

  async updateTransferStatus(input: UpdateTableTransferStatusInput): Promise<TableTransferRequest | null> {
    const db = delegates(prisma);
    const existing = await db.diningTableTransferRequest.findFirst({
      where: {
        id: input.transferId,
        tenantId: input.tenantId,
        locationId: input.locationId,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await db.diningTableTransferRequest.update({
      where: { id: input.transferId },
      data: {
        status: input.status,
        approvedBy: input.approvedBy ?? null,
        rejectedReason: input.rejectedReason ?? null,
        completedAt: input.completedAt ?? null,
      },
    });

    return mapTransfer(updated);
  }

  async executeApprovedTransfer(input: TransferExecutionInput): Promise<TransferExecutionResult | null> {
    const db = delegates(prisma);

    return db.$transaction(async (tx) => {
      const transfer = await tx.diningTableTransferRequest.findFirst({
        where: {
          id: input.transferId,
          tenantId: input.tenantId,
          locationId: input.locationId,
        },
      });

      if (!transfer) {
        return null;
      }

      const session = await tx.diningSession.findFirst({
        where: {
          id: transfer.sessionId,
          tenantId: input.tenantId,
          locationId: input.locationId,
          deletedAt: null,
        },
      });

      if (!session) {
        return null;
      }

      const fromTable = await tx.diningTable.findFirst({
        where: {
          id: transfer.fromTableId,
          tenantId: input.tenantId,
          locationId: input.locationId,
          deletedAt: null,
        },
      });

      const toTable = await tx.diningTable.findFirst({
        where: {
          id: transfer.toTableId,
          tenantId: input.tenantId,
          locationId: input.locationId,
          deletedAt: null,
        },
      });

      if (!fromTable || !toTable) {
        return null;
      }

      if (toTable.activeSessionId && toTable.activeSessionId !== session.id) {
        return null;
      }

      await tx.diningSession.updateMany({
        where: {
          id: session.id,
          tenantId: input.tenantId,
          locationId: input.locationId,
          deletedAt: null,
        },
        data: {
          tableId: toTable.id,
          updatedBy: input.approvedBy,
        },
      });

      await tx.diningTable.updateMany({
        where: {
          id: fromTable.id,
          tenantId: input.tenantId,
          locationId: input.locationId,
          deletedAt: null,
        },
        data: {
          status: 'CLEANING',
          activeSessionId: null,
          lastStatusChangedAt: new Date(),
          lastStatusChangedBy: input.approvedBy,
          updatedBy: input.approvedBy,
          version: { increment: 1 },
        },
      });

      await tx.diningTable.updateMany({
        where: {
          id: toTable.id,
          tenantId: input.tenantId,
          locationId: input.locationId,
          deletedAt: null,
        },
        data: {
          status: 'OCCUPIED',
          activeSessionId: session.id,
          currentWaiterId: fromTable.currentWaiterId ?? toTable.currentWaiterId ?? null,
          lastStatusChangedAt: new Date(),
          lastStatusChangedBy: input.approvedBy,
          updatedBy: input.approvedBy,
          version: { increment: 1 },
        },
      });

      await tx.diningTableAssignment.updateMany({
        where: {
          sessionId: session.id,
          tenantId: input.tenantId,
          locationId: input.locationId,
          status: 'ACTIVE',
        },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      await tx.diningTableAssignment.create({
        data: {
          tenantId: input.tenantId,
          locationId: input.locationId,
          sessionId: session.id,
          tableId: toTable.id,
          status: 'ACTIVE',
          assignedBy: input.approvedBy,
          assignedAt: new Date(),
        },
      });

      const completed = await tx.diningTableTransferRequest.update({
        where: { id: transfer.id },
        data: {
          status: 'COMPLETED',
          approvedBy: input.approvedBy,
          completedAt: new Date(),
        },
      });

      const nextSession = await tx.diningSession.findFirst({
        where: {
          id: session.id,
          tenantId: input.tenantId,
          locationId: input.locationId,
          deletedAt: null,
        },
      });
      const nextFrom = await tx.diningTable.findFirst({
        where: {
          id: fromTable.id,
          tenantId: input.tenantId,
          locationId: input.locationId,
          deletedAt: null,
        },
      });
      const nextTo = await tx.diningTable.findFirst({
        where: {
          id: toTable.id,
          tenantId: input.tenantId,
          locationId: input.locationId,
          deletedAt: null,
        },
      });

      if (!nextSession || !nextFrom || !nextTo) {
        return null;
      }

      return {
        transfer: mapTransfer(completed),
        session: mapSession(nextSession),
        fromTable: mapTable(nextFrom),
        toTable: mapTable(nextTo),
      };
    });
  }

  async listHistoryBySession(sessionId: string, tenantId: string, locationId: string): Promise<TableTransferHistoryResult> {
    const db = delegates(prisma);

    const assignments = await db.diningTableAssignment.findMany({
      where: {
        sessionId,
        tenantId,
        locationId,
      },
      orderBy: { assignedAt: 'asc' },
    });

    const transfers = await db.diningTableTransferRequest.findMany({
      where: {
        sessionId,
        tenantId,
        locationId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      assignments: assignments.map((record: unknown) => mapAssignment(record)),
      transfers: transfers.map((record: unknown) => mapTransfer(record)),
    };
  }
}
