import type { TableTransferStatus } from './table-transfer.contract';

export interface TableTransferRequested {
  transferId: string;
  sessionId: string;
  fromTableId: string;
  toTableId: string;
  tenantId: string;
  locationId: string;
  requestedBy: string;
  reason: string;
}

export interface TableTransferApproved {
  transferId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  approvedBy: string;
  previousStatus: TableTransferStatus;
  nextStatus: TableTransferStatus;
}

export interface SessionTableChanged {
  sessionId: string;
  tenantId: string;
  locationId: string;
  fromTableId: string;
  toTableId: string;
  transferredBy: string;
}

export interface OldTableReleased {
  tableId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  releasedBy: string;
}

export interface NewTableOccupied {
  tableId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  occupiedBy: string;
}

export interface TableTransferCompleted {
  transferId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  completedBy: string;
  completedAt: string | Date;
}

export interface TableTransferRejected {
  transferId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  rejectedBy: string;
  reason: string;
}
