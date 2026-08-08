export type TableGroupStatus = 'ACTIVE' | 'RELEASED';

export type TableMergeStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export interface TableGroup {
  id: string;
  tenantId: string;
  locationId: string;
  sessionId: string;
  status: TableGroupStatus;
  createdAt: string | Date;
  releasedAt?: string | Date | null;
  createdBy: string;
}

export interface TableGroupMember {
  id: string;
  tableGroupId: string;
  tableId: string;
  joinedAt: string | Date;
  releasedAt?: string | Date | null;
}

export interface TableMergeRequest {
  id: string;
  sessionId: string;
  tableIds: string[];
  requestedBy: string;
  reason: string;
  status: TableMergeStatus;
  approvedBy?: string | null;
  createdAt: string | Date;
}
