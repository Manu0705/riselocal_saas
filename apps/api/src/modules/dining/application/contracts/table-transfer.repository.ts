import type {
  TableAssignment,
  TableTransferRequest,
  TableTransferStatus,
} from '@saas/domain-core/dining/table-transfer.contract';
import type { SessionStatus } from '@saas/domain-core/dining/session.contract';
import type { TableStatus } from '@saas/domain-core/dining/table.contract';

export interface SessionSummaryRecord {
  id: string;
  tenantId: string;
  locationId: string;
  tableId: string;
  status: SessionStatus;
  assignedWaiterId?: string | null;
  updatedBy?: string | null;
}

export interface TableSummaryRecord {
  id: string;
  tenantId: string;
  locationId: string;
  status: TableStatus;
  activeSessionId?: string | null;
  currentWaiterId?: string | null;
  lastStatusChangedBy: string;
  version: number;
}

export interface CreateTableTransferInput {
  tenantId: string;
  locationId: string;
  sessionId: string;
  fromTableId: string;
  toTableId: string;
  requestedBy: string;
  reason: string;
}

export interface UpdateTableTransferStatusInput {
  transferId: string;
  tenantId: string;
  locationId: string;
  status: TableTransferStatus;
  approvedBy?: string | null;
  rejectedReason?: string | null;
  completedAt?: Date | null;
}

export interface TransferExecutionInput {
  transferId: string;
  tenantId: string;
  locationId: string;
  approvedBy: string;
}

export interface TransferExecutionResult {
  transfer: TableTransferRequest;
  session: SessionSummaryRecord;
  fromTable: TableSummaryRecord;
  toTable: TableSummaryRecord;
}

export interface TableTransferHistoryResult {
  assignments: TableAssignment[];
  transfers: TableTransferRequest[];
}

export interface TableTransferRepository {
  findSessionById(sessionId: string, tenantId: string, locationId: string): Promise<SessionSummaryRecord | null>;
  findTableById(tableId: string, tenantId: string, locationId: string): Promise<TableSummaryRecord | null>;
  findTransferById(transferId: string, tenantId: string, locationId: string): Promise<TableTransferRequest | null>;
  createTransferRequest(input: CreateTableTransferInput): Promise<TableTransferRequest>;
  updateTransferStatus(input: UpdateTableTransferStatusInput): Promise<TableTransferRequest | null>;
  executeApprovedTransfer(input: TransferExecutionInput): Promise<TransferExecutionResult | null>;
  listHistoryBySession(sessionId: string, tenantId: string, locationId: string): Promise<TableTransferHistoryResult>;
}
