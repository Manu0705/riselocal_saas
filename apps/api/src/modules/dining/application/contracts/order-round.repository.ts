import type {
  KitchenItemStatus,
  OrderRecord,
  OrderRound,
  OrderRoundStatus,
  OrderStatus,
} from '@saas/domain-core/dining/order-round.contract';

export interface OrderRoundRecord extends Omit<OrderRound, 'submittedAt' | 'cancelledAt' | 'createdAt'> {
  submittedAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
  draftCartId?: string | null;
  idempotencyKey?: string | null;
}

export interface DiningOrderRecord extends Omit<OrderRecord, 'submittedAt'> {
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
  version: number;
}

export interface DiningOrderItemRecord {
  id: string;
  tenantId: string;
  locationId: string;
  orderId: string;
  menuItemId: string;
  itemSnapshot: Record<string, unknown>;
  priceSnapshot: Record<string, unknown>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  kitchenStatus: KitchenItemStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
  version: number;
}

export interface OrderRoundCreateInput {
  tenantId: string;
  locationId: string;
  sessionId: string;
  draftCartId: string;
  roundNumber: number;
  createdBy?: string | null;
  status?: OrderRoundStatus;
}

export interface OrderRoundUpdateInput {
  id: string;
  tenantId: string;
  locationId: string;
  expectedVersion: number;
  status?: OrderRoundStatus;
  submittedBy?: string | null;
  submittedAt?: Date | null;
  cancelledBy?: string | null;
  cancelledAt?: Date | null;
  idempotencyKey?: string | null;
  updatedBy?: string | null;
}

export interface DiningOrderCreateInput {
  tenantId: string;
  locationId: string;
  roundId: string;
  sessionId: string;
  status?: OrderStatus;
  totalAmount: number;
  submittedAt: Date;
  createdBy?: string | null;
}

export interface DiningOrderItemCreateInput {
  tenantId: string;
  locationId: string;
  orderId: string;
  menuItemId: string;
  itemSnapshot: Record<string, unknown>;
  priceSnapshot: Record<string, unknown>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  kitchenStatus?: KitchenItemStatus;
  createdBy?: string | null;
}

export interface OrderRoundRepository {
  findDraftBySession(sessionId: string, tenantId: string, locationId: string): Promise<OrderRoundRecord | null>;
  findById(id: string, tenantId: string, locationId: string): Promise<OrderRoundRecord | null>;
  listBySession(sessionId: string, tenantId: string, locationId: string): Promise<OrderRoundRecord[]>;
  findMaxRoundNumber(sessionId: string, tenantId: string, locationId: string): Promise<number>;
  createRound(input: OrderRoundCreateInput): Promise<OrderRoundRecord>;
  updateRound(input: OrderRoundUpdateInput): Promise<OrderRoundRecord | null>;
  findOrderByRound(roundId: string, tenantId: string, locationId: string): Promise<DiningOrderRecord | null>;
  createOrder(input: DiningOrderCreateInput): Promise<DiningOrderRecord>;
  updateOrderStatus(
    orderId: string,
    tenantId: string,
    locationId: string,
    status: OrderStatus,
    updatedBy?: string | null,
  ): Promise<DiningOrderRecord | null>;
  createOrderItems(inputs: DiningOrderItemCreateInput[]): Promise<DiningOrderItemRecord[]>;
  listOrdersBySession(sessionId: string, tenantId: string, locationId: string): Promise<DiningOrderRecord[]>;
  listOrderItemsByOrderIds(orderIds: string[], tenantId: string, locationId: string): Promise<DiningOrderItemRecord[]>;
}