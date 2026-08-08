export type TableStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'ORDERING'
  | 'SERVING'
  | 'BILLING'
  | 'CLEANING'
  | 'MAINTENANCE';

export interface DiningTable {
  id: string;
  tenantId: string;
  locationId: string;
  areaId: string;
  name: string;
  capacity: number;
  status: TableStatus;
  activeSessionId?: string | null;
  currentWaiterId?: string | null;
  lastStatusChangedAt: string;
  lastStatusChangedBy: string;
  version: number;
}