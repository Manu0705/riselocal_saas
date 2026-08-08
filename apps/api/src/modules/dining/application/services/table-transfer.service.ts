import {
  canTransitionTableTransferStatus,
  normalizeTableTransferStatus,
} from '@saas/domain-core/dining/table-transfer.validation';
import { isActiveSessionStatus } from '@saas/domain-core/dining/session.validation';
import { normalizeTableStatus } from '@saas/domain-core/dining/table.validation';
import type { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import type {
  SessionSummaryRecord,
  TableTransferRepository,
} from '../contracts/table-transfer.repository';

interface ScopedRequest {
  tenantId: string;
  locationId: string;
}

export interface RequestTransferInput extends ScopedRequest {
  sessionId: string;
  destinationTableId: string;
  reason: string;
  requestedBy: string;
  actorRole?: string | null;
}

export interface ApproveTransferInput extends ScopedRequest {
  transferId: string;
  approvedBy: string;
  actorRole?: string | null;
}

export interface RejectTransferInput extends ScopedRequest {
  transferId: string;
  rejectedBy: string;
  actorRole?: string | null;
  reason: string;
}

export interface TransferHistoryInput extends ScopedRequest {
  sessionId: string;
  actorRole?: string | null;
}

function assertScoped(tenantId: string, locationId: string) {
  if (!tenantId || !locationId) {
    throw new Error('tenantId and locationId are required');
  }
}

function normalizeRole(role?: string | null): string {
  return String(role || '').trim().toLowerCase();
}

function canRequestTransfer(role?: string | null): boolean {
  return ['waiter', 'reception', 'receptionist', 'manager', 'owner', 'admin', 'super_admin', 'staff'].includes(
    normalizeRole(role),
  );
}

function canApproveTransfer(role?: string | null): boolean {
  return ['reception', 'receptionist', 'manager', 'owner', 'admin', 'super_admin'].includes(normalizeRole(role));
}

function isManagerRole(role?: string | null): boolean {
  return ['manager', 'owner', 'admin', 'super_admin'].includes(normalizeRole(role));
}

export class TableTransferService {
  constructor(
    private readonly repository: TableTransferRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async requestTransfer(input: RequestTransferInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!canRequestTransfer(input.actorRole)) {
      throw new Error('Permission denied for transfer request');
    }

    const reason = String(input.reason || '').trim();
    if (!reason) {
      throw new Error('reason is required');
    }

    const session = await this.requireSession(input.sessionId, input.tenantId, input.locationId);
    if (!isActiveSessionStatus(session.status)) {
      throw new Error('Session is closed or archived');
    }

    const fromTable = await this.requireTable(session.tableId, input.tenantId, input.locationId);
    const toTable = await this.requireTable(input.destinationTableId, input.tenantId, input.locationId);

    if (fromTable.id === toTable.id) {
      throw new Error('Destination table must be different from source table');
    }

    const destinationStatus = normalizeTableStatus(toTable.status);
    if (destinationStatus === 'MAINTENANCE') {
      throw new Error('Destination table is under maintenance');
    }

    if (toTable.activeSessionId && toTable.activeSessionId !== session.id) {
      throw new Error('Destination table already has an active session');
    }

    if (destinationStatus !== 'AVAILABLE' && destinationStatus !== 'RESERVED') {
      throw new Error('Destination table is not available');
    }

    const transfer = await this.repository.createTransferRequest({
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: session.id,
      fromTableId: fromTable.id,
      toTableId: toTable.id,
      requestedBy: input.requestedBy,
      reason,
    });

    await this.eventPublisher.publish({
      type: 'TableTransferRequested',
      payload: {
        transferId: transfer.id,
        sessionId: transfer.sessionId,
        fromTableId: transfer.fromTableId,
        toTableId: transfer.toTableId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        requestedBy: input.requestedBy,
        reason,
      },
    });

    return transfer;
  }

  async approveTransfer(input: ApproveTransferInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!canApproveTransfer(input.actorRole)) {
      throw new Error('Permission denied for transfer approval');
    }

    const existing = await this.repository.findTransferById(input.transferId, input.tenantId, input.locationId);
    if (!existing) {
      throw new Error('Transfer request not found');
    }

    const currentStatus = normalizeTableTransferStatus(existing.status);
    if (!canTransitionTableTransferStatus(currentStatus, 'APPROVED')) {
      throw new Error(`Cannot approve transfer from status ${currentStatus}`);
    }

    const session = await this.requireSession(existing.sessionId, input.tenantId, input.locationId);
    if (!isActiveSessionStatus(session.status)) {
      throw new Error('Session is closed or archived');
    }

    if (normalizeRole(input.actorRole).startsWith('reception') && session.status === 'BILLING') {
      throw new Error('Manager approval required during billing');
    }

    const destination = await this.requireTable(existing.toTableId, input.tenantId, input.locationId);
    if (
      destination.activeSessionId &&
      destination.activeSessionId !== existing.sessionId &&
      !isManagerRole(input.actorRole)
    ) {
      throw new Error('Destination table already has an active session');
    }

    const approved = await this.repository.updateTransferStatus({
      transferId: existing.id,
      tenantId: input.tenantId,
      locationId: input.locationId,
      status: 'APPROVED',
      approvedBy: input.approvedBy,
    });

    if (!approved) {
      throw new Error('Transfer update conflict');
    }

    await this.eventPublisher.publish({
      type: 'TableTransferApproved',
      payload: {
        transferId: approved.id,
        sessionId: approved.sessionId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        approvedBy: input.approvedBy,
        previousStatus: currentStatus,
        nextStatus: 'APPROVED',
      },
    });

    const executed = await this.repository.executeApprovedTransfer({
      transferId: approved.id,
      tenantId: input.tenantId,
      locationId: input.locationId,
      approvedBy: input.approvedBy,
    });

    if (!executed) {
      throw new Error('Transfer execution conflict');
    }

    await this.eventPublisher.publish({
      type: 'SessionTableChanged',
      payload: {
        sessionId: executed.session.id,
        tenantId: executed.session.tenantId,
        locationId: executed.session.locationId,
        fromTableId: executed.transfer.fromTableId,
        toTableId: executed.transfer.toTableId,
        transferredBy: input.approvedBy,
      },
    });

    await this.eventPublisher.publish({
      type: 'OldTableReleased',
      payload: {
        tableId: executed.fromTable.id,
        sessionId: executed.session.id,
        tenantId: executed.session.tenantId,
        locationId: executed.session.locationId,
        releasedBy: input.approvedBy,
      },
    });

    await this.eventPublisher.publish({
      type: 'NewTableOccupied',
      payload: {
        tableId: executed.toTable.id,
        sessionId: executed.session.id,
        tenantId: executed.session.tenantId,
        locationId: executed.session.locationId,
        occupiedBy: input.approvedBy,
      },
    });

    await this.eventPublisher.publish({
      type: 'TableTransferCompleted',
      payload: {
        transferId: executed.transfer.id,
        sessionId: executed.transfer.sessionId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        completedBy: input.approvedBy,
        completedAt: executed.transfer.completedAt || new Date(),
      },
    });

    return executed;
  }

  async rejectTransfer(input: RejectTransferInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!canApproveTransfer(input.actorRole)) {
      throw new Error('Permission denied for transfer rejection');
    }

    const reason = String(input.reason || '').trim();
    if (!reason) {
      throw new Error('reason is required');
    }

    const existing = await this.repository.findTransferById(input.transferId, input.tenantId, input.locationId);
    if (!existing) {
      throw new Error('Transfer request not found');
    }

    const currentStatus = normalizeTableTransferStatus(existing.status);
    if (!canTransitionTableTransferStatus(currentStatus, 'REJECTED')) {
      throw new Error(`Cannot reject transfer from status ${currentStatus}`);
    }

    const rejected = await this.repository.updateTransferStatus({
      transferId: existing.id,
      tenantId: input.tenantId,
      locationId: input.locationId,
      status: 'REJECTED',
      approvedBy: input.rejectedBy,
      rejectedReason: reason,
      completedAt: new Date(),
    });

    if (!rejected) {
      throw new Error('Transfer update conflict');
    }

    await this.eventPublisher.publish({
      type: 'TableTransferRejected',
      payload: {
        transferId: rejected.id,
        sessionId: rejected.sessionId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        rejectedBy: input.rejectedBy,
        reason,
      },
    });

    return rejected;
  }

  async getSessionHistory(input: TransferHistoryInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!canRequestTransfer(input.actorRole)) {
      throw new Error('Permission denied for transfer history');
    }

    await this.requireSession(input.sessionId, input.tenantId, input.locationId);
    return this.repository.listHistoryBySession(input.sessionId, input.tenantId, input.locationId);
  }

  private async requireSession(sessionId: string, tenantId: string, locationId: string): Promise<SessionSummaryRecord> {
    const session = await this.repository.findSessionById(sessionId, tenantId, locationId);
    if (!session) {
      throw new Error('Dining session not found');
    }

    return session;
  }

  private async requireTable(tableId: string, tenantId: string, locationId: string) {
    const table = await this.repository.findTableById(tableId, tenantId, locationId);
    if (!table) {
      throw new Error('Dining table not found');
    }

    return table;
  }
}
