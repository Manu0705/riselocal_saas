import type {
  TableGroup,
  TableGroupMember,
  TableMergeRequest,
} from '@saas/domain-core/dining/table-group.contract';

export interface CreateMergeRequestInput {
  tenantId: string;
  locationId: string;
  sessionId: string;
  tableIds: string[];
  requestedBy: string;
  reason: string;
}

export interface UpdateMergeRequestStatusInput {
  tenantId: string;
  locationId: string;
  mergeId: string;
  status: 'APPROVED' | 'REJECTED' | 'COMPLETED';
  approvedBy?: string | null;
}

export interface CreateTableGroupInput {
  tenantId: string;
  locationId: string;
  sessionId: string;
  createdBy: string;
}

export interface TableGroupRepository {
  findSessionById(sessionId: string, tenantId: string, locationId: string): Promise<{
    id: string;
    tenantId: string;
    locationId: string;
    tableId: string;
    status: string;
    assignedWaiterId?: string | null;
    updatedBy?: string | null;
  } | null>;
  findTableById(tableId: string, tenantId: string, locationId: string): Promise<{
    id: string;
    tenantId: string;
    locationId: string;
    status: string;
    activeSessionId?: string | null;
    currentWaiterId?: string | null;
    lastStatusChangedBy?: string | null;
    version: number;
  } | null>;
  findActiveGroupBySession(sessionId: string, tenantId: string, locationId: string): Promise<TableGroup | null>;
  createMergeRequest(input: CreateMergeRequestInput): Promise<TableMergeRequest>;
  findMergeRequestById(mergeId: string, tenantId: string, locationId: string): Promise<TableMergeRequest | null>;
  updateMergeRequestStatus(input: UpdateMergeRequestStatusInput): Promise<TableMergeRequest | null>;
  createGroup(input: CreateTableGroupInput): Promise<TableGroup>;
  addGroupMembers(groupId: string, tableIds: string[], tenantId: string): Promise<TableGroupMember[]>;
  releaseGroup(groupId: string, tenantId: string, locationId: string, releasedBy: string): Promise<TableGroup | null>;
  findGroupById(groupId: string, tenantId: string, locationId: string): Promise<TableGroup | null>;
  listGroupHistory(sessionId: string, tenantId: string, locationId: string): Promise<{
    group: TableGroup;
    members: TableGroupMember[];
    request?: TableMergeRequest | null;
  }[]>;
}
