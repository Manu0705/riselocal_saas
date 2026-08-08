import { prisma } from '@saas/database';
import {
  type DiningOrderCreateInput,
  type DiningOrderItemCreateInput,
  type DiningOrderItemRecord,
  type DiningOrderRecord,
  type OrderRoundCreateInput,
  type OrderRoundRecord,
  type OrderRoundRepository,
  type OrderRoundUpdateInput,
} from '../../application/contracts/order-round.repository';
import type { OrderStatus } from '@saas/domain-core/dining/order-round.contract';

type Delegate = {
  create(args: unknown): Promise<any>;
  createMany(args: unknown): Promise<any>;
  updateMany(args: unknown): Promise<any>;
  findFirst(args: unknown): Promise<any | null>;
  findMany(args: unknown): Promise<any[]>;
};

type Delegates = {
  diningOrderRound: Delegate;
  diningOrder: Delegate;
  diningOrderItem: Delegate;
};

function delegates(client: unknown): Delegates {
  return client as Delegates;
}

export class PrismaOrderRoundRepository implements OrderRoundRepository {
  async findDraftBySession(sessionId: string, tenantId: string, locationId: string): Promise<OrderRoundRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningOrderRound.findFirst({
      where: { sessionId, tenantId, locationId, status: 'DRAFT', deletedAt: null },
      orderBy: { roundNumber: 'desc' },
    });

    return record ? this.mapRound(record) : null;
  }

  async findById(id: string, tenantId: string, locationId: string): Promise<OrderRoundRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningOrderRound.findFirst({
      where: { id, tenantId, locationId, deletedAt: null },
    });

    return record ? this.mapRound(record) : null;
  }

  async listBySession(sessionId: string, tenantId: string, locationId: string): Promise<OrderRoundRecord[]> {
    const db = delegates(prisma);
    const records = await db.diningOrderRound.findMany({
      where: { sessionId, tenantId, locationId, deletedAt: null },
      orderBy: { roundNumber: 'asc' },
    });

    return records.map((record: unknown) => this.mapRound(record));
  }

  async findMaxRoundNumber(sessionId: string, tenantId: string, locationId: string): Promise<number> {
    const db = delegates(prisma);
    const record = await db.diningOrderRound.findFirst({
      where: { sessionId, tenantId, locationId, deletedAt: null },
      orderBy: { roundNumber: 'desc' },
      select: { roundNumber: true },
    });

    return record ? Number(record.roundNumber) : 0;
  }

  async createRound(input: OrderRoundCreateInput): Promise<OrderRoundRecord> {
    const db = delegates(prisma);
    const created = await db.diningOrderRound.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        sessionId: input.sessionId,
        draftCartId: input.draftCartId,
        roundNumber: input.roundNumber,
        status: input.status ?? 'DRAFT',
        createdBy: input.createdBy ?? null,
        updatedBy: input.createdBy ?? null,
      },
    });

    return this.mapRound(created);
  }

  async updateRound(input: OrderRoundUpdateInput): Promise<OrderRoundRecord | null> {
    const now = new Date();
    const db = delegates(prisma);
    const result = await db.diningOrderRound.updateMany({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        locationId: input.locationId,
        deletedAt: null,
        version: input.expectedVersion,
      },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.submittedBy !== undefined ? { submittedBy: input.submittedBy } : {}),
        ...(input.submittedAt !== undefined ? { submittedAt: input.submittedAt } : {}),
        ...(input.cancelledBy !== undefined ? { cancelledBy: input.cancelledBy } : {}),
        ...(input.cancelledAt !== undefined ? { cancelledAt: input.cancelledAt } : {}),
        ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
        updatedBy: input.updatedBy ?? null,
        updatedAt: now,
        version: { increment: 1 },
      },
    });

    if (!result || result.count === 0) {
      return null;
    }

    const record = await db.diningOrderRound.findFirst({
      where: { id: input.id, tenantId: input.tenantId, locationId: input.locationId, deletedAt: null },
    });

    return record ? this.mapRound(record) : null;
  }

  async findOrderByRound(roundId: string, tenantId: string, locationId: string): Promise<DiningOrderRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningOrder.findFirst({
      where: { roundId, tenantId, locationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return record ? this.mapOrder(record) : null;
  }

  async createOrder(input: DiningOrderCreateInput): Promise<DiningOrderRecord> {
    const db = delegates(prisma);
    const created = await db.diningOrder.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        roundId: input.roundId,
        sessionId: input.sessionId,
        status: input.status ?? 'SUBMITTED',
        totalAmount: input.totalAmount,
        submittedAt: input.submittedAt,
        createdBy: input.createdBy ?? null,
        updatedBy: input.createdBy ?? null,
      },
    });

    return this.mapOrder(created);
  }

  async updateOrderStatus(
    orderId: string,
    tenantId: string,
    locationId: string,
    status: OrderStatus,
    updatedBy?: string | null,
  ): Promise<DiningOrderRecord | null> {
    const db = delegates(prisma);
    const result = await db.diningOrder.updateMany({
      where: { id: orderId, tenantId, locationId, deletedAt: null },
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

    const record = await db.diningOrder.findFirst({
      where: { id: orderId, tenantId, locationId, deletedAt: null },
    });

    return record ? this.mapOrder(record) : null;
  }

  async createOrderItems(inputs: DiningOrderItemCreateInput[]): Promise<DiningOrderItemRecord[]> {
    if (inputs.length === 0) {
      return [];
    }

    const db = delegates(prisma);
    await db.diningOrderItem.createMany({
      data: inputs.map((input) => ({
        tenantId: input.tenantId,
        locationId: input.locationId,
        orderId: input.orderId,
        menuItemId: input.menuItemId,
        itemSnapshot: input.itemSnapshot,
        priceSnapshot: input.priceSnapshot,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        subtotal: input.subtotal,
        kitchenStatus: input.kitchenStatus ?? 'PENDING',
        createdBy: input.createdBy ?? null,
        updatedBy: input.createdBy ?? null,
      })),
    });

    const created = await db.diningOrderItem.findMany({
      where: {
        tenantId: inputs[0].tenantId,
        locationId: inputs[0].locationId,
        orderId: inputs[0].orderId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return created.map((record: unknown) => this.mapOrderItem(record));
  }

  async listOrdersBySession(sessionId: string, tenantId: string, locationId: string): Promise<DiningOrderRecord[]> {
    const db = delegates(prisma);
    const records = await db.diningOrder.findMany({
      where: { sessionId, tenantId, locationId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record: unknown) => this.mapOrder(record));
  }

  async listOrderItemsByOrderIds(orderIds: string[], tenantId: string, locationId: string): Promise<DiningOrderItemRecord[]> {
    if (orderIds.length === 0) {
      return [];
    }

    const db = delegates(prisma);
    const records = await db.diningOrderItem.findMany({
      where: {
        orderId: { in: orderIds },
        tenantId,
        locationId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record: unknown) => this.mapOrderItem(record));
  }

  private mapRound(record: any): OrderRoundRecord {
    return {
      ...record,
      roundNumber: Number(record.roundNumber),
      version: Number(record.version ?? 0),
    };
  }

  private mapOrder(record: any): DiningOrderRecord {
    return {
      ...record,
      totalAmount: Number(record.totalAmount ?? 0),
      version: Number(record.version ?? 0),
    };
  }

  private mapOrderItem(record: any): DiningOrderItemRecord {
    return {
      ...record,
      itemSnapshot: (record.itemSnapshot ?? {}) as Record<string, unknown>,
      priceSnapshot: (record.priceSnapshot ?? {}) as Record<string, unknown>,
      quantity: Number(record.quantity ?? 0),
      unitPrice: Number(record.unitPrice ?? 0),
      subtotal: Number(record.subtotal ?? 0),
      version: Number(record.version ?? 0),
    };
  }
}