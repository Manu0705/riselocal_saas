import type { OrderLockStatus } from './order-lock.contract';

export type OrderLockFailureReason =
  | 'PRICE_CHANGED'
  | 'ITEM_UNAVAILABLE'
  | 'VERSION_CONFLICT'
  | 'SESSION_CLOSED'
  | 'PERMISSION_DENIED'
  | 'ORDER_NOT_FOUND'
  | 'LOCK_STATE_INVALID';

export interface OrderLockRequested {
  orderId: string;
  tenantId: string;
  locationId: string;
  requestedBy: string;
  requestedAt: string | Date;
}

export interface OrderLocked {
  orderId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  previousStatus: OrderLockStatus;
  nextStatus: OrderLockStatus;
  lockedBy: string;
  lockedAt: string | Date;
}

export interface OrderReopened {
  orderId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  managerId: string;
  reason?: string | null;
}

export interface OrderLockFailed {
  orderId: string;
  tenantId: string;
  locationId: string;
  reasonCode: OrderLockFailureReason;
  message: string;
  requestedBy?: string | null;
}
