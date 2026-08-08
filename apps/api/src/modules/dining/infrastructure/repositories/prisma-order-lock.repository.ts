import { prisma } from '@saas/database';
import {
  normalizeOrderItemLockStatus,
  normalizeOrderLockStatus,
} from '@saas/domain-core/dining/order-lock.validation';
import { normalizeOrderStatus } from '@saas/domain-core/dining/order-round.validation';
import type {
  OrderLockEventCreateInput,
  OrderLockRepository,
  OrderLockUpdateInput,
  OrderLockUpsertInput,
  OrderSummaryRecord,
  OrderItemSummaryRecord,
} from '../../application/contracts/order-lock.repository';
import type { OrderLockRecord } from '@saas/domain-core/dining/order-lock.contract';

type Delegate = {
  findFirst(args: unknown): Promise<any | null>;
  findMany(args: unknown): Promise<any[]>;
  create(args: unknown): Promise<any>;
  update(args: unknown): Promise<any>;
  updateMany(args: unknown): Promise<any>;
};

type Delegates = {
  diningOrder: Delegate;
  diningOrderItem: Delegate;
  diningOrderLock: Delegate;
  diningOrderLockEvent: Delegate;
};

function delegates(client: unknown): Delegates {
  return client as Delegates;
}

function mapOrder(record: any): OrderSummaryRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    sessionId: record.sessionId,
    status: normalizeOrderStatus(record.status),
    totalAmount: Number(record.totalAmount ?? 0),
    version: Number(record.version ?? 0),
    submittedAt: record.submittedAt,
    roundId: record.roundId,
  };
}

function mapOrderLock(record: any): OrderLockRecord {
  return {
    id: record.id,
    orderId: record.orderId,
    tenantId: record.tenantId,
    locationId: record.locationId,
    status: normalizeOrderLockStatus(record.status),
    lockedBy: record.lockedBy ?? null,
    lockedAt: record.lockedAt ?? null,
    reason: record.reason ?? null,
    version: Number(record.version ?? 0),
  };
}

function mapOrderItem(record: any): OrderItemSummaryRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    orderId: record.orderId,
    menuItemId: record.menuItemId,
    quantity: Number(record.quantity ?? 0),
    unitPrice: Number(record.unitPrice ?? 0),
    subtotal: Number(record.subtotal ?? 0),
    kitchenStatus: String(record.kitchenStatus || 'PENDING'),
    lockStatus: normalizeOrderItemLockStatus(record.lockStatus),
    lockedAt: record.lockedAt ?? null,
    lockedBy: record.lockedBy ?? null,
    version: Number(record.version ?? 0),
  };
}

export class PrismaOrderLockRepository implements OrderLockRepository {
  async findOrderById(orderId: string, tenantId: string, locationId: string): Promise<OrderSummaryRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningOrder.findFirst({
      where: {
        id: orderId,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    return record ? mapOrder(record) : null;
  }

  async findOrderLock(orderId: string, tenantId: string, locationId: string): Promise<OrderLockRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningOrderLock.findFirst({
      where: {
        orderId,
        tenantId,
        locationId,
      },
    });

    return record ? mapOrderLock(record) : null;
  }

  async listOrderItems(orderId: string, tenantId: string, locationId: string): Promise<OrderItemSummaryRecord[]> {
    const db = delegates(prisma);
    const records = await db.diningOrderItem.findMany({
      where: {
        orderId,
        tenantId,
        locationId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record: unknown) => mapOrderItem(record));
  }

  async upsertOrderLock(input: OrderLockUpsertInput): Promise<OrderLockRecord> {
    const db = delegates(prisma);
    const existing = await db.diningOrderLock.findFirst({
      where: {
        orderId: input.orderId,
        tenantId: input.tenantId,
        locationId: input.locationId,
      },
    });

    if (existing) {
      const updated = await db.diningOrderLock.update({
        where: { id: existing.id },
        data: {
          status: input.status,
          lockedBy: input.lockedBy ?? null,
          lockedAt: input.lockedAt ?? null,
          reason: input.reason ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
          version: { increment: 1 },
        },
      });
      return mapOrderLock(updated);
    }

    const created = await db.diningOrderLock.create({
      data: {
        orderId: input.orderId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        status: input.status,
        lockedBy: input.lockedBy ?? null,
        lockedAt: input.lockedAt ?? null,
        reason: input.reason ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
      },
    });

    return mapOrderLock(created);
  }

  async updateOrderLock(input: OrderLockUpdateInput): Promise<OrderLockRecord | null> {
    const db = delegates(prisma);
    const existing = await db.diningOrderLock.findFirst({
      where: {
        orderId: input.orderId,
        tenantId: input.tenantId,
        locationId: input.locationId,
      },
    });

    if (!existing) {
      return null;
    }

    if (input.expectedVersion !== undefined && Number(existing.version) !== Number(input.expectedVersion)) {
      return null;
    }

    const updated = await db.diningOrderLock.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        lockedBy: input.lockedBy ?? null,
        lockedAt: input.lockedAt ?? null,
        reason: input.reason ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
        version: { increment: 1 },
      },
    });

    return mapOrderLock(updated);
  }

  async updateOrderStatus(
    orderId: string,
    tenantId: string,
    locationId: string,
    status: string,
    updatedBy?: string | null,
    expectedVersion?: number,
  ): Promise<OrderSummaryRecord | null> {
    const db = delegates(prisma);

    const where: Record<string, unknown> = {
      id: orderId,
      tenantId,
      locationId,
      deletedAt: null,
    };

    if (expectedVersion !== undefined) {
      where.version = expectedVersion;
    }

    const result = await db.diningOrder.updateMany({
      where,
      data: {
        status,
        updatedBy: updatedBy ?? null,
        updatedAt: new Date(),
        version: { increment: 1 },
      },
    });

    if (!result || result.count === 0) {
      return null;
    }

    const updated = await db.diningOrder.findFirst({
      where: {
        id: orderId,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    return updated ? mapOrder(updated) : null;
  }

  async updateOrderItemsLock(
    orderId: string,
    tenantId: string,
    locationId: string,
    lockStatus: string,
    lockedBy?: string | null,
    lockedAt?: Date | null,
  ): Promise<number> {
    const db = delegates(prisma);
    const result = await db.diningOrderItem.updateMany({
      where: {
        orderId,
        tenantId,
        locationId,
        deletedAt: null,
      },
      data: {
        lockStatus,
        lockedBy: lockedBy ?? null,
        lockedAt: lockedAt ?? null,
        updatedBy: lockedBy ?? null,
        updatedAt: new Date(),
        version: { increment: 1 },
      },
    });

    return Number(result?.count ?? 0);
  }

  async createOrderLockEvent(input: OrderLockEventCreateInput): Promise<void> {
    const db = delegates(prisma);
    await db.diningOrderLockEvent.create({
      data: {
        orderId: input.orderId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        action: input.action,
        performedBy: input.performedBy ?? null,
        previousState: input.previousState ?? null,
        newState: input.newState ?? null,
        reason: input.reason ?? null,
      },
    });
  }
}
