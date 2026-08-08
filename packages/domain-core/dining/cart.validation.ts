import type { CartItemStatus, CartStatus } from './cart.contract';

export const CART_STATUSES: readonly CartStatus[] = ['ACTIVE', 'SUBMITTING', 'SUBMITTED', 'ARCHIVED'];
export const CART_ITEM_STATUSES: readonly CartItemStatus[] = ['DRAFT', 'LOCKED', 'REMOVED'];

export const CART_ALLOWED_TRANSITIONS: Record<CartStatus, readonly CartStatus[]> = {
  ACTIVE: ['SUBMITTING', 'SUBMITTED', 'ARCHIVED'],
  SUBMITTING: ['SUBMITTED', 'ARCHIVED'],
  SUBMITTED: ['ARCHIVED', 'ACTIVE'],
  ARCHIVED: [],
};

export const CART_ITEM_ALLOWED_TRANSITIONS: Record<CartItemStatus, readonly CartItemStatus[]> = {
  DRAFT: ['LOCKED', 'REMOVED'],
  LOCKED: ['REMOVED'],
  REMOVED: [],
};

export function normalizeCartStatus(value: unknown): CartStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (CART_STATUSES.includes(normalized as CartStatus)) {
    return normalized as CartStatus;
  }

  return 'ACTIVE';
}

export function normalizeCartItemStatus(value: unknown): CartItemStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (CART_ITEM_STATUSES.includes(normalized as CartItemStatus)) {
    return normalized as CartItemStatus;
  }

  return 'DRAFT';
}

export function canTransitionCartStatus(current: CartStatus, next: CartStatus): boolean {
  if (current === next) {
    return true;
  }

  return CART_ALLOWED_TRANSITIONS[current].includes(next);
}

export function canTransitionCartItemStatus(current: CartItemStatus, next: CartItemStatus): boolean {
  if (current === next) {
    return true;
  }

  return CART_ITEM_ALLOWED_TRANSITIONS[current].includes(next);
}

export function isActiveCartStatus(status: CartStatus): boolean {
  return status === 'ACTIVE';
}

export function isLockedCartItemStatus(status: CartItemStatus): boolean {
  return status === 'LOCKED';
}

export function isDraftCartItemStatus(status: CartItemStatus): boolean {
  return status === 'DRAFT';
}

export function isRemovedCartItemStatus(status: CartItemStatus): boolean {
  return status === 'REMOVED';
}

export function isValidCartQuantity(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}