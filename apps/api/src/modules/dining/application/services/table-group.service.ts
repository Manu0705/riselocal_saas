import {
  canTransitionTableMergeStatus,
  normalizeTableGroupStatus,
  normalizeTableMergeStatus,
} from '@saas/domain-core/dining/table-group.validation';
import { isActiveSessionStatus } from '@saas/domain-core/dining/session.validation';
import { normalizeTableStatus } from '@saas/domain-core/dining/table.validation';
import type { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import type { TableGroupRepository } from '../contracts/table-group.repository';

interface ScopedRequest {
  tenantId: string;
  locationId: string;
}

export interface RequestMergeInput extends ScopedRequest {
  sessionId: string;
  tableIds: string[];
  requestedBy: string;
  reason: string;
  actorRole?: string | null;
}

export interface ApproveMergeInput extends ScopedRequest {
  mergeId: string;
  approvedBy: string;
  actorRole?: string | null;
}

export interface ReleaseGroupInput extends ScopedRequest {
  groupId: string;
  releasedBy: string;
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

function canRequestMerge(role?: string | null): boolean {
  return ['reception', 'receptionist', 'waiter', 'manager', 'owner', 'admin', 'super_admin', 'staff'].includes(
    normalizeRole(role),
  );
}

function canApproveMerge(role?: string | null): boolean {
  return ['manager', 'owner', 'admin', 'super_admin', 'reception', 'receptionist'].includes(normalizeRole(role));
}

function canReleaseGroup(role?: string | null): boolean {
  return ['reception', 'receptionist', 'waiter', 'manager', 'owner', 'admin', 'super_admin', 'staff'].includes(
    normalizeRole(role),
  );
}

export class TableGroupService {
  constructor(
    private readonly repository: TableGroupRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async requestMerge(input: RequestMergeInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!canRequestMerge(input.actorRole)) {
      throw new Error('Permission denied for merge request');
    }

    const reason = String(input.reason || '').trim();
    if (!reason) {
      throw new Error('reason is required');
    }

    const session = await this.requireSession(input.sessionId, input.tenantId, input.locationId);
    if (!isActiveSessionStatus(session.status as any)) {
      throw new Error('Session is closed or archived');
    }

    const normalizedTableIds = Array.from(new Set((input.tableIds || []).filter(Boolean)));
    if (normalizedTableIds.length < 2) {
      throw new Error('At least two tables are required for merge');
    }

    const tables = [] as Array<{ id: string; status: string; activeSessionId?: string | null }>;
    for (const tableId of normalizedTableIds) {
      const table = await this.requireTable(tableId, input.tenantId, input.locationId);
      const status = normalizeTableStatus(table.status);
      if (status === 'MAINTENANCE') {
        throw new Error('Merged tables cannot be under maintenance');
      }
      if (table.activeSessionId && table.activeSessionId !== session.id) {
        throw new Error('Tables in merge must not belong to another active session');
      }
      tables.push(table);
    }

    const existingGroup = await this.repository.findActiveGroupBySession(input.sessionId, input.tenantId, input.locationId);
    if (existingGroup) {
      throw new Error('Session already has an active table group');
    }

    const request = await this.repository.createMergeRequest({
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: input.sessionId,
      tableIds: normalizedTableIds,
      requestedBy: input.requestedBy,
      reason,
    });

    await this.eventPublisher.publish({
      type: 'TableMergeRequested',
      payload: {
        mergeId: request.id,
        sessionId: request.sessionId,
        tableIds: normalizedTableIds,
        tenantId: input.tenantId,
        locationId: input.locationId,
        requestedBy: input.requestedBy,
        reason,
      },
    });

    return request;
  }

  async approveMerge(input: ApproveMergeInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!canApproveMerge(input.actorRole)) {
      throw new Error('Permission denied for merge approval');
    }

    const request = await this.repository.findMergeRequestById(input.mergeId, input.tenantId, input.locationId);
    if (!request) {
      throw new Error('Merge request not found');
    }

    const currentStatus = normalizeTableMergeStatus('REQUESTED');
    if (!canTransitionTableMergeStatus(currentStatus, 'APPROVED')) {
      throw new Error('Cannot approve merge request');
    }

    const updated = await this.repository.updateMergeRequestStatus({
      tenantId: input.tenantId,
      locationId: input.locationId,
      mergeId: input.mergeId,
      status: 'APPROVED',
      approvedBy: input.approvedBy,
    });

    if (!updated) {
      throw new Error('Merge update conflict');
    }

    const group = await this.repository.createGroup({
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: updated.sessionId,
      createdBy: input.approvedBy,
    });

    await this.repository.addGroupMembers(group.id, updated.tableIds, input.tenantId);

    await this.eventPublisher.publish({
      type: 'TableMergeApproved',
      payload: {
        mergeId: updated.id,
        sessionId: updated.sessionId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        approvedBy: input.approvedBy,
      },
    });

    await this.eventPublisher.publish({
      type: 'TableGroupCreated',
      payload: {
        groupId: group.id,
        sessionId: updated.sessionId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        tableIds: updated.tableIds,
        createdBy: input.approvedBy,
      },
    });

    await this.eventPublisher.publish({
      type: 'TablesMerged',
      payload: {
        groupId: group.id,
        sessionId: updated.sessionId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        tableIds: updated.tableIds,
        mergedBy: input.approvedBy,
      },
    });

    return { request: updated, group };
  }

  async releaseGroup(input: ReleaseGroupInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!canReleaseGroup(input.actorRole)) {
      throw new Error('Permission denied for merge release');
    }

    const group = await this.repository.findGroupById(input.groupId, input.tenantId, input.locationId);
    if (!group) {
      throw new Error('Table group not found');
    }

    if (normalizeTableGroupStatus(group.status) === 'RELEASED') {
      return group;
    }

    const released = await this.repository.releaseGroup(input.groupId, input.tenantId, input.locationId, input.releasedBy);
    if (!released) {
      throw new Error('Table group release conflict');
    }

    await this.eventPublisher.publish({
      type: 'TableGroupReleased',
      payload: {
        groupId: released.id,
        sessionId: released.sessionId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        releasedBy: input.releasedBy,
      },
    });

    return released;
  }

  private async requireSession(sessionId: string, tenantId: string, locationId: string) {
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
