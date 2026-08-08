export type OrderRoundStatus = 'DRAFT' | 'SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export type OrderStatus =
  | 'SUBMITTED'
  | 'LOCKED'
  | 'REOPEN_REQUESTED'
  | 'REOPENED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export type KitchenItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

export interface OrderRound {
  id: string;
  tenantId: string;
  locationId: string;
  sessionId: string;
  roundNumber: number;
  status: OrderRoundStatus;
  submittedBy?: string | null;
  submittedAt?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  version: number;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  roundId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  status: OrderStatus;
  totalAmount: number;
  submittedAt: string;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  menuItemId: string;
  itemSnapshot: Record<string, unknown>;
  priceSnapshot: Record<string, unknown>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  kitchenStatus: KitchenItemStatus;
  lockStatus?: 'DRAFT' | 'LOCKED' | 'PROCESSING' | 'COMPLETED';
  lockedAt?: string | Date | null;
  lockedBy?: string | null;
}