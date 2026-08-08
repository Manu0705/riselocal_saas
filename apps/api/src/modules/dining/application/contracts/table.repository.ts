import type { DiningTable, TableStatus } from '@saas/domain-core/dining/table.contract';

export interface TableRecord extends DiningTable {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

export interface TableCreateInput {
  tenantId: string;
  locationId: string;
  areaId: string;
  name: string;
  capacity: number;
  status?: TableStatus;
  activeSessionId?: string | null;
  currentWaiterId?: string | null;
  lastStatusChangedAt?: Date;
  lastStatusChangedBy: string;
  version?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface TableUpdateInput {
  id: string;
  tenantId: string;
  locationId: string;
  expectedVersion: number;
  status?: TableStatus;
  activeSessionId?: string | null;
  currentWaiterId?: string | null;
  lastStatusChangedAt?: Date;
  lastStatusChangedBy?: string | null;
  updatedBy?: string | null;
}

export interface TableRepository {
  findById(id: string, tenantId: string, locationId: string): Promise<TableRecord | null>;
  findAllByLocation(tenantId: string, locationId: string, status?: TableStatus): Promise<TableRecord[]>;
  findByActiveSessionId(sessionId: string, tenantId: string, locationId: string): Promise<TableRecord | null>;
  createTable(input: TableCreateInput): Promise<TableRecord>;
  updateTable(input: TableUpdateInput): Promise<TableRecord | null>;
}