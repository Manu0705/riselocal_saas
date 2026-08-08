export type TableAssignmentStatus = 'ACTIVE' | 'RELEASED';

export type TableTransferStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export interface TableAssignment {
  id: string;
  sessionId: string;
  tableId: string;
  status: TableAssignmentStatus;
  assignedAt: string | Date;
  releasedAt?: string | Date | null;
  assignedBy: string;
}

export interface TableTransferRequest {
  id: string;
  sessionId: string;
  fromTableId: string;
  toTableId: string;
  requestedBy: string;
  reason: string;
  status: TableTransferStatus;
  approvedBy?: string | null;
  createdAt: string | Date;
  completedAt?: string | Date | null;
}
