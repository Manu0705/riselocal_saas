export type OrderLockStatus = 'UNLOCKED' | 'LOCK_REQUESTED' | 'LOCKED' | 'REOPEN_REQUESTED' | 'REOPENED';

export type OrderItemLockStatus = 'DRAFT' | 'LOCKED' | 'PROCESSING' | 'COMPLETED';

export interface OrderLockRecord {
  id: string;
  orderId: string;
  tenantId: string;
  locationId: string;
  status: OrderLockStatus;
  lockedBy?: string | null;
  lockedAt?: string | Date | null;
  reason?: string | null;
  version: number;
}

export interface OrderLockEventRecord {
  id: string;
  orderId: string;
  tenantId: string;
  locationId: string;
  action: string;
  performedBy?: string | null;
  previousState?: string | null;
  newState?: string | null;
  reason?: string | null;
  createdAt?: string | Date;
}
