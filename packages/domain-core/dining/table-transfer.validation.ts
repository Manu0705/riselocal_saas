import type {
  TableAssignmentStatus,
  TableTransferStatus,
} from './table-transfer.contract';

export const TABLE_ASSIGNMENT_STATUSES: readonly TableAssignmentStatus[] = ['ACTIVE', 'RELEASED'];

export const TABLE_TRANSFER_STATUSES: readonly TableTransferStatus[] = [
  'REQUESTED',
  'APPROVED',
  'COMPLETED',
  'REJECTED',
];

export const TABLE_TRANSFER_ALLOWED_TRANSITIONS: Record<TableTransferStatus, readonly TableTransferStatus[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['COMPLETED', 'REJECTED'],
  COMPLETED: [],
  REJECTED: [],
};

export function normalizeTableAssignmentStatus(value: unknown): TableAssignmentStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (TABLE_ASSIGNMENT_STATUSES.includes(normalized as TableAssignmentStatus)) {
    return normalized as TableAssignmentStatus;
  }

  return 'ACTIVE';
}

export function normalizeTableTransferStatus(value: unknown): TableTransferStatus {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (TABLE_TRANSFER_STATUSES.includes(normalized as TableTransferStatus)) {
    return normalized as TableTransferStatus;
  }

  return 'REQUESTED';
}

export function canTransitionTableTransferStatus(current: TableTransferStatus, next: TableTransferStatus): boolean {
  if (current === next) {
    return true;
  }

  return TABLE_TRANSFER_ALLOWED_TRANSITIONS[current].includes(next);
}
