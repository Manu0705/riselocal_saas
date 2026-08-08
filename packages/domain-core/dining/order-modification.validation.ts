import type { AdjustmentType, ModificationStatus } from './order-modification.contract';

export const MODIFICATION_STATUSES: readonly ModificationStatus[] = [
  'REQUESTED',
  'APPROVED',
  'PROCESSING',
  'COMPLETED',
  'REJECTED',
];

export const ADJUSTMENT_TYPES: readonly AdjustmentType[] = [
  'CANCEL',
  'QUANTITY_CHANGE',
  'REPLACE',
  'ADD_NOTE',
];

export const MODIFICATION_ALLOWED_TRANSITIONS: Record<ModificationStatus, readonly ModificationStatus[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['PROCESSING', 'COMPLETED'],
  PROCESSING: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
};

export function normalizeModificationStatus(value: unknown): ModificationStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (MODIFICATION_STATUSES.includes(normalized as ModificationStatus)) {
    return normalized as ModificationStatus;
  }

  return 'REQUESTED';
}

export function normalizeAdjustmentType(value: unknown): AdjustmentType {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (ADJUSTMENT_TYPES.includes(normalized as AdjustmentType)) {
    return normalized as AdjustmentType;
  }

  return 'CANCEL';
}

export function canTransitionModificationStatus(current: ModificationStatus, next: ModificationStatus): boolean {
  if (current === next) {
    return true;
  }

  return MODIFICATION_ALLOWED_TRANSITIONS[current].includes(next);
}

export function isMutableKitchenStatus(status: string): boolean {
  const normalized = String(status || '').trim().toUpperCase();
  return ['PENDING', 'PREPARING', 'READY'].includes(normalized);
}
