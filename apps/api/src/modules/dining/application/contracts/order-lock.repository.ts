import type {
  OrderItemLockStatus,
  OrderLockEventRecord,
  OrderLockRecord,
  OrderLockStatus,
} from '@saas/domain-core/dining/order-lock.contract';
import type { OrderStatus } from '@saas/domain-core/dining/order-round.contract';

export interface OrderSummaryRecord {
  id: string;
  tenantId: string;
  locationId: string;
  sessionId: string;
  status: OrderStatus;
  totalAmount: number;
  version: number;
  submittedAt: Date;
  roundId: string;
}

export interface OrderItemSummaryRecord {
  id: string;
  tenantId: string;
  locationId: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  kitchenStatus: string;
  lockStatus: OrderItemLockStatus;
  lockedAt?: Date | null;
  lockedBy?: string | null;
  version: number;
}

export interface OrderLockUpsertInput {
  orderId: string;
  tenantId: string;
  locationId: string;
  status: OrderLockStatus;
  lockedBy?: string | null;
  lockedAt?: Date | null;
  reason?: string | null;
  idempotencyKey?: string | null;
}

export interface OrderLockUpdateInput {
  orderId: string;
  tenantId: string;
  locationId: string;
  expectedVersion?: number;
  status: OrderLockStatus;
  lockedBy?: string | null;
  lockedAt?: Date | null;
  reason?: string | null;
  idempotencyKey?: string | null;
}

export interface OrderLockEventCreateInput extends Omit<OrderLockEventRecord, 'id' | 'createdAt'> {}

export interface OrderLockRepository {
  findOrderById(orderId: string, tenantId: string, locationId: string): Promise<OrderSummaryRecord | null>;
  findOrderLock(orderId: string, tenantId: string, locationId: string): Promise<OrderLockRecord | null>;
  listOrderItems(orderId: string, tenantId: string, locationId: string): Promise<OrderItemSummaryRecord[]>;
  upsertOrderLock(input: OrderLockUpsertInput): Promise<OrderLockRecord>;
  updateOrderLock(input: OrderLockUpdateInput): Promise<OrderLockRecord | null>;
  updateOrderStatus(
    orderId: string,
    tenantId: string,
    locationId: string,
    status: OrderStatus,
    updatedBy?: string | null,
    expectedVersion?: number,
  ): Promise<OrderSummaryRecord | null>;
  updateOrderItemsLock(
    orderId: string,
    tenantId: string,
    locationId: string,
    lockStatus: OrderItemLockStatus,
    lockedBy?: string | null,
    lockedAt?: Date | null,
  ): Promise<number>;
  createOrderLockEvent(input: OrderLockEventCreateInput): Promise<void>;
}
