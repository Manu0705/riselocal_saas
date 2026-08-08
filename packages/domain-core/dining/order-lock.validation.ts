import type { OrderItemLockStatus, OrderLockStatus } from './order-lock.contract';

export const ORDER_LOCK_STATUSES: readonly OrderLockStatus[] = [
  'UNLOCKED',
  'LOCK_REQUESTED',
  'LOCKED',
  'REOPEN_REQUESTED',
  'REOPENED',
];

export const ORDER_ITEM_LOCK_STATUSES: readonly OrderItemLockStatus[] = [
  'DRAFT',
  'LOCKED',
  'PROCESSING',
  'COMPLETED',
];

export const ORDER_LOCK_ALLOWED_TRANSITIONS: Record<OrderLockStatus, readonly OrderLockStatus[]> = {
  UNLOCKED: ['LOCK_REQUESTED', 'LOCKED'],
  LOCK_REQUESTED: ['LOCKED', 'UNLOCKED'],
  LOCKED: ['REOPEN_REQUESTED', 'REOPENED'],
  REOPEN_REQUESTED: ['REOPENED', 'LOCKED'],
  REOPENED: ['LOCK_REQUESTED', 'LOCKED'],
};

export const ORDER_ITEM_LOCK_ALLOWED_TRANSITIONS: Record<OrderItemLockStatus, readonly OrderItemLockStatus[]> = {
  DRAFT: ['LOCKED'],
  LOCKED: ['PROCESSING', 'COMPLETED'],
  PROCESSING: ['COMPLETED'],
  COMPLETED: [],
};

export function normalizeOrderLockStatus(value: unknown): OrderLockStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (ORDER_LOCK_STATUSES.includes(normalized as OrderLockStatus)) {
    return normalized as OrderLockStatus;
  }

  return 'UNLOCKED';
}

export function normalizeOrderItemLockStatus(value: unknown): OrderItemLockStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (ORDER_ITEM_LOCK_STATUSES.includes(normalized as OrderItemLockStatus)) {
    return normalized as OrderItemLockStatus;
  }

  return 'DRAFT';
}

export function canTransitionOrderLockStatus(current: OrderLockStatus, next: OrderLockStatus): boolean {
  if (current === next) {
    return true;
  }

  return ORDER_LOCK_ALLOWED_TRANSITIONS[current].includes(next);
}

export function canTransitionOrderItemLockStatus(current: OrderItemLockStatus, next: OrderItemLockStatus): boolean {
  if (current === next) {
    return true;
  }

  return ORDER_ITEM_LOCK_ALLOWED_TRANSITIONS[current].includes(next);
}

export function isLockedOrderStatus(status: OrderLockStatus): boolean {
  return status === 'LOCKED';
}

export function isReopenRequestedOrderStatus(status: OrderLockStatus): boolean {
  return status === 'REOPEN_REQUESTED';
}
