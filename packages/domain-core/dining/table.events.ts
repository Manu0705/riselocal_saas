import type { TableStatus } from './table.contract';

export interface TableOccupied {
  tableId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  previousStatus?: TableStatus;
  occupiedBy?: string | null;
}

export interface TableStatusChanged {
  tableId: string;
  tenantId: string;
  locationId: string;
  previousStatus: TableStatus;
  nextStatus: TableStatus;
  changedBy?: string | null;
  activeSessionId?: string | null;
}

export interface TableCleaningStarted {
  tableId: string;
  tenantId: string;
  locationId: string;
  previousStatus: TableStatus;
  startedBy?: string | null;
}

export interface TableAvailable {
  tableId: string;
  tenantId: string;
  locationId: string;
  previousStatus?: TableStatus;
  completedBy?: string | null;
}

export interface TableMaintenanceStarted {
  tableId: string;
  tenantId: string;
  locationId: string;
  previousStatus: TableStatus;
  startedBy?: string | null;
}

export interface TableMaintenanceCompleted {
  tableId: string;
  tenantId: string;
  locationId: string;
  previousStatus: TableStatus;
  completedBy?: string | null;
}

export interface WaiterAssignedToTable {
  tableId: string;
  tenantId: string;
  locationId: string;
  waiterId: string;
  assignedBy?: string | null;
  previousWaiterId?: string | null;
}