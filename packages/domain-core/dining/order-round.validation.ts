import type { KitchenItemStatus, OrderRoundStatus, OrderStatus } from './order-round.contract';

export const ORDER_ROUND_STATUSES: readonly OrderRoundStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
];

export const ORDER_ROUND_ALLOWED_TRANSITIONS: Record<OrderRoundStatus, readonly OrderRoundStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['PROCESSING', 'COMPLETED', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'SUBMITTED',
  'LOCKED',
  'REOPEN_REQUESTED',
  'REOPENED',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
];
export const KITCHEN_ITEM_STATUSES: readonly KitchenItemStatus[] = [
  'PENDING',
  'PREPARING',
  'READY',
  'SERVED',
  'CANCELLED',
];

export function normalizeOrderRoundStatus(value: unknown): OrderRoundStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (ORDER_ROUND_STATUSES.includes(normalized as OrderRoundStatus)) {
    return normalized as OrderRoundStatus;
  }

  return 'DRAFT';
}

export function normalizeOrderStatus(value: unknown): OrderStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (ORDER_STATUSES.includes(normalized as OrderStatus)) {
    return normalized as OrderStatus;
  }

  return 'SUBMITTED';
}

export function normalizeKitchenItemStatus(value: unknown): KitchenItemStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (KITCHEN_ITEM_STATUSES.includes(normalized as KitchenItemStatus)) {
    return normalized as KitchenItemStatus;
  }

  return 'PENDING';
}

export function canTransitionOrderRoundStatus(current: OrderRoundStatus, next: OrderRoundStatus): boolean {
  if (current === next) {
    return true;
  }

  return ORDER_ROUND_ALLOWED_TRANSITIONS[current].includes(next);
}

export function isDraftOrderRoundStatus(status: OrderRoundStatus): boolean {
  return status === 'DRAFT';
}

export function isSubmittedLikeOrderRoundStatus(status: OrderRoundStatus): boolean {
  return status === 'SUBMITTED' || status === 'PROCESSING' || status === 'COMPLETED';
}

export function isClosedOrderRoundStatus(status: OrderRoundStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}