export interface TableMergeRequested {
  mergeId: string;
  sessionId: string;
  tableIds: string[];
  tenantId: string;
  locationId: string;
  requestedBy: string;
  reason: string;
}

export interface TableMergeApproved {
  mergeId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  approvedBy: string;
}

export interface TableGroupCreated {
  groupId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  tableIds: string[];
  createdBy: string;
}

export interface TablesMerged {
  groupId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  tableIds: string[];
  mergedBy: string;
}

export interface TableGroupReleased {
  groupId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  releasedBy: string;
}
