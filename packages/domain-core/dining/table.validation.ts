import type { TableStatus } from './table.contract';

export const TABLE_STATUSES: readonly TableStatus[] = [
  'AVAILABLE',
  'RESERVED',
  'OCCUPIED',
  'ORDERING',
  'SERVING',
  'BILLING',
  'CLEANING',
  'MAINTENANCE',
];

export const TABLE_ALLOWED_TRANSITIONS: Record<TableStatus, readonly TableStatus[]> = {
  AVAILABLE: ['RESERVED', 'OCCUPIED', 'MAINTENANCE'],
  RESERVED: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'],
  OCCUPIED: ['ORDERING', 'SERVING', 'BILLING', 'CLEANING', 'MAINTENANCE'],
  ORDERING: ['SERVING', 'BILLING', 'CLEANING', 'MAINTENANCE'],
  SERVING: ['BILLING', 'CLEANING', 'MAINTENANCE'],
  BILLING: ['CLEANING', 'MAINTENANCE'],
  CLEANING: ['AVAILABLE', 'MAINTENANCE'],
  MAINTENANCE: ['AVAILABLE'],
};

export function normalizeTableStatus(value: unknown): TableStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (TABLE_STATUSES.includes(normalized as TableStatus)) {
    return normalized as TableStatus;
  }

  return 'AVAILABLE';
}

export function canTransitionTableStatus(current: TableStatus, next: TableStatus): boolean {
  if (current === next) {
    return true;
  }

  return TABLE_ALLOWED_TRANSITIONS[current].includes(next);
}

export function isMaintenanceTableStatus(status: TableStatus): boolean {
  return status === 'MAINTENANCE';
}

export function isAvailableTableStatus(status: TableStatus): boolean {
  return status === 'AVAILABLE';
}

export function isCleaningTableStatus(status: TableStatus): boolean {
  return status === 'CLEANING';
}