import { prisma } from '@saas/database';
import {
  normalizeAdjustmentType,
  normalizeModificationStatus,
} from '@saas/domain-core/dining/order-modification.validation';
import { normalizeOrderStatus } from '@saas/domain-core/dining/order-round.validation';
import type {
  OrderItemAdjustment,
  OrderModificationRequest,
} from '@saas/domain-core/dining/order-modification.contract';
import type {
  CreateAdjustmentInput,
  CreateModificationRequestInput,
  OrderItemSummaryRecord,
  OrderModificationRepository,
  OrderSummaryRecord,
  UpdateModificationRequestInput,
} from '../../application/contracts/order-modification.repository';

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
  diningOrderModificationRequest: Delegate;
  diningOrderItemAdjustment: Delegate;
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
  };
}

function mapOrderItem(record: any): OrderItemSummaryRecord {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    orderId: record.orderId,
    quantity: Number(record.quantity ?? 0),
    subtotal: Number(record.subtotal ?? 0),
    unitPrice: Number(record.unitPrice ?? 0),
    kitchenStatus: String(record.kitchenStatus || 'PENDING'),
    lockStatus: String(record.lockStatus || 'DRAFT'),
    itemSnapshot: (record.itemSnapshot ?? {}) as Record<string, unknown>,
    priceSnapshot: (record.priceSnapshot ?? {}) as Record<string, unknown>,
    version: Number(record.version ?? 0),
  };
}

function mapModification(record: any): OrderModificationRequest {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    orderId: record.orderId,
    sessionId: record.sessionId,
    requestedBy: record.requestedBy,
    reason: record.reason,
    status: normalizeModificationStatus(record.status),
    approvedBy: record.approvedBy ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt ?? null,
  };
}

function mapAdjustment(record: any): OrderItemAdjustment {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    orderId: record.orderId,
    orderItemId: record.orderItemId,
    modificationRequestId: record.modificationRequestId,
    type: normalizeAdjustmentType(record.type),
    oldValue: (record.oldValue ?? null) as Record<string, unknown> | null,
    newValue: (record.newValue ?? null) as Record<string, unknown> | null,
    reason: record.reason,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
  };
}

export class PrismaOrderModificationRepository implements OrderModificationRepository {
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

  async findOrderItemById(orderItemId: string, tenantId: string, locationId: string): Promise<OrderItemSummaryRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningOrderItem.findFirst({
      where: {
        id: orderItemId,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    return record ? mapOrderItem(record) : null;
  }

  async findModificationById(modificationId: string, tenantId: string, locationId: string): Promise<OrderModificationRequest | null> {
    const db = delegates(prisma);
    const record = await db.diningOrderModificationRequest.findFirst({
      where: {
        id: modificationId,
        tenantId,
        locationId,
      },
    });

    return record ? mapModification(record) : null;
  }

  async findModificationByIdempotency(
    orderId: string,
    tenantId: string,
    locationId: string,
    idempotencyKey: string,
  ): Promise<OrderModificationRequest | null> {
    const db = delegates(prisma);
    const record = await db.diningOrderModificationRequest.findFirst({
      where: {
        orderId,
        tenantId,
        locationId,
        idempotencyKey,
      },
      orderBy: { createdAt: 'desc' },
    });

    return record ? mapModification(record) : null;
  }

  async createModificationRequest(input: CreateModificationRequestInput): Promise<OrderModificationRequest> {
    const db = delegates(prisma);
    const created = await db.diningOrderModificationRequest.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        orderId: input.orderId,
        sessionId: input.sessionId,
        requestedBy: input.requestedBy,
        reason: input.reason,
        status: input.status ?? 'REQUESTED',
        approvedBy: input.approvedBy ?? null,
        completedAt: input.completedAt ?? null,
        rejectedReason: input.rejectedReason ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
      },
    });

    return mapModification(created);
  }

  async updateModificationRequest(input: UpdateModificationRequestInput): Promise<OrderModificationRequest | null> {
    const db = delegates(prisma);
    const existing = await db.diningOrderModificationRequest.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        locationId: input.locationId,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await db.diningOrderModificationRequest.update({
      where: { id: input.id },
      data: {
        status: input.status,
        approvedBy: input.approvedBy ?? null,
        completedAt: input.completedAt ?? null,
        rejectedReason: input.rejectedReason ?? null,
      },
    });

    return mapModification(updated);
  }

  async createAdjustment(input: CreateAdjustmentInput): Promise<OrderItemAdjustment> {
    const db = delegates(prisma);
    const created = await db.diningOrderItemAdjustment.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        orderId: input.orderId,
        orderItemId: input.orderItemId,
        modificationRequestId: input.modificationRequestId,
        type: input.type,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,
        reason: input.reason,
        createdBy: input.createdBy,
      },
    });

    return mapAdjustment(created);
  }

  async listModificationsByOrder(orderId: string, tenantId: string, locationId: string): Promise<OrderModificationRequest[]> {
    const db = delegates(prisma);
    const records = await db.diningOrderModificationRequest.findMany({
      where: {
        orderId,
        tenantId,
        locationId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record: unknown) => mapModification(record));
  }

  async listAdjustmentsByModificationIds(
    modificationIds: string[],
    tenantId: string,
    locationId: string,
  ): Promise<OrderItemAdjustment[]> {
    if (modificationIds.length === 0) {
      return [];
    }

    const db = delegates(prisma);
    const records = await db.diningOrderItemAdjustment.findMany({
      where: {
        modificationRequestId: { in: modificationIds },
        tenantId,
        locationId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((record: unknown) => mapAdjustment(record));
  }

  async updateOrderItemAsCancelled(
    orderItemId: string,
    tenantId: string,
    locationId: string,
    updatedBy: string,
  ): Promise<OrderItemSummaryRecord | null> {
    const db = delegates(prisma);

    const existing = await db.diningOrderItem.findFirst({
      where: {
        id: orderItemId,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await db.diningOrderItem.update({
      where: { id: orderItemId },
      data: {
        kitchenStatus: 'CANCELLED',
        updatedBy,
        updatedAt: new Date(),
        version: { increment: 1 },
      },
    });

    return mapOrderItem(updated);
  }

  async updateOrderTotal(orderId: string, tenantId: string, locationId: string, totalAmount: number, updatedBy: string): Promise<void> {
    const db = delegates(prisma);
    await db.diningOrder.updateMany({
      where: {
        id: orderId,
        tenantId,
        locationId,
        deletedAt: null,
      },
      data: {
        totalAmount,
        updatedBy,
        updatedAt: new Date(),
        version: { increment: 1 },
      },
    });
  }
}
