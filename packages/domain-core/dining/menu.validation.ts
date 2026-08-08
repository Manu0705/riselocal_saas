export const ALLOWED_AVAILABILITY_TRANSITIONS: Record<string, readonly string[]> = {
  AVAILABLE: ['OUT_OF_STOCK', 'TEMPORARILY_UNAVAILABLE', 'DISABLED'],
  OUT_OF_STOCK: ['AVAILABLE', 'DISABLED'],
  TEMPORARILY_UNAVAILABLE: ['AVAILABLE', 'DISABLED'],
  DISABLED: ['AVAILABLE'],
};

export function isValidPrice(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function isArchivedStatus(status?: string): boolean {
  return status === 'ARCHIVED';
}

export function isPubliclyVisibleMenu(status?: string): boolean {
  return status === 'ACTIVE';
}

export function canBeOrdered(status?: string): boolean {
  return status === 'AVAILABLE';
}
