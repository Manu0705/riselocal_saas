export type TableMergeTransition = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export function normalizeTableMergeStatus(status?: string | null): TableMergeTransition {
  const normalized = String(status || '').trim().toUpperCase();
  switch (normalized) {
    case 'APPROVED':
      return 'APPROVED';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'REJECTED':
      return 'REJECTED';
    default:
      return 'REQUESTED';
  }
}

export function canTransitionTableMergeStatus(current: string, next: TableMergeTransition): boolean {
  const normalized = normalizeTableMergeStatus(current);
  switch (normalized) {
    case 'REQUESTED':
      return next === 'APPROVED' || next === 'REJECTED';
    case 'APPROVED':
      return next === 'COMPLETED';
    case 'COMPLETED':
    case 'REJECTED':
      return false;
    default:
      return false;
  }
}

export function normalizeTableGroupStatus(status?: string | null): 'ACTIVE' | 'RELEASED' {
  return String(status || '').trim().toUpperCase() === 'RELEASED' ? 'RELEASED' : 'ACTIVE';
}
