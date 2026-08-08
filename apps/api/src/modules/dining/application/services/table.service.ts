import type { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import type { TableRecord, TableRepository } from '../contracts/table.repository';
import {
  canTransitionTableStatus,
  isCleaningTableStatus,
  isAvailableTableStatus,
  isMaintenanceTableStatus,
  normalizeTableStatus,
} from '@saas/domain-core/dining/table.validation';
import type { TableStatus } from '@saas/domain-core/dining/table.contract';

interface ScopedRequest {
  tenantId: string;
  locationId: string;
}

export interface ListTablesInput extends ScopedRequest {
  status?: TableStatus | string;
}

export interface GetTableInput extends ScopedRequest {
  tableId: string;
}

export interface ChangeTableStatusInput extends ScopedRequest {
  tableId: string;
  status: TableStatus | string;
  activeSessionId?: string | null;
  changedBy?: string | null;
  actorRole?: string | null;
}

export interface AssignWaiterInput extends ScopedRequest {
  tableId: string;
  waiterId: string;
  assignedBy?: string | null;
  actorRole?: string | null;
}

export interface RestoreMaintenanceInput extends ScopedRequest {
  tableId: string;
  changedBy?: string | null;
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

function isOperationalRole(role?: string | null): boolean {
  return ['owner', 'manager', 'staff', 'admin', 'super_admin'].includes(normalizeRole(role));
}

function isMaintenanceRole(role?: string | null): boolean {
  return ['owner', 'manager', 'admin', 'super_admin'].includes(normalizeRole(role));
}

export class TableService {
  constructor(
    private readonly repository: TableRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async listTables(input: ListTablesInput): Promise<TableRecord[]> {
    assertScoped(input.tenantId, input.locationId);
    const status = input.status ? normalizeTableStatus(input.status) : undefined;
    return this.repository.findAllByLocation(input.tenantId, input.locationId, status);
  }

  async getTable(input: GetTableInput): Promise<TableRecord> {
    assertScoped(input.tenantId, input.locationId);
    const table = await this.repository.findById(input.tableId, input.tenantId, input.locationId);
    if (!table) {
      throw new Error('Dining table not found');
    }

    return table;
  }

  async updateStatus(input: ChangeTableStatusInput): Promise<TableRecord> {
    assertScoped(input.tenantId, input.locationId);

    const table = await this.getTable(input);
    const nextStatus = normalizeTableStatus(input.status);

    if (!isOperationalRole(input.actorRole) && !isMaintenanceRole(input.actorRole)) {
      throw new Error('Permission denied for table status changes');
    }

    if (isMaintenanceTableStatus(nextStatus) && !isMaintenanceRole(input.actorRole)) {
      throw new Error('Permission denied for table maintenance changes');
    }

    if (isMaintenanceTableStatus(table.status) && nextStatus !== 'AVAILABLE' && !isMaintenanceRole(input.actorRole)) {
      throw new Error('Permission denied for maintenance table changes');
    }

    if (nextStatus === 'OCCUPIED' && !input.activeSessionId && !table.activeSessionId) {
      throw new Error('activeSessionId is required when occupying a table');
    }

    if (!canTransitionTableStatus(table.status, nextStatus)) {
      throw new Error(`Invalid table transition from ${table.status} to ${nextStatus}`);
    }

    if (nextStatus === 'CLEANING' && !table.activeSessionId && !input.activeSessionId) {
      throw new Error('Cleaning requires a prior dining session');
    }

    const nextActiveSessionId =
      nextStatus === 'AVAILABLE' || nextStatus === 'CLEANING' || nextStatus === 'MAINTENANCE'
        ? null
        : input.activeSessionId ?? table.activeSessionId ?? null;

    if (table.status === nextStatus && table.activeSessionId === nextActiveSessionId) {
      return table;
    }

    const updated = await this.repository.updateTable({
      id: table.id,
      tenantId: table.tenantId,
      locationId: table.locationId,
      expectedVersion: table.version,
      status: nextStatus,
      activeSessionId: nextActiveSessionId,
      currentWaiterId: table.currentWaiterId ?? null,
      lastStatusChangedAt: new Date(),
      lastStatusChangedBy: input.changedBy ?? table.lastStatusChangedBy,
      updatedBy: input.changedBy ?? null,
    });

    if (!updated) {
      throw new Error('Table update conflict');
    }

    await this.publishStatusEvents(table, updated, input.changedBy ?? null, input.activeSessionId ?? table.activeSessionId ?? null);
    return updated;
  }

  async assignWaiter(input: AssignWaiterInput): Promise<TableRecord> {
    assertScoped(input.tenantId, input.locationId);

    if (!isOperationalRole(input.actorRole)) {
      throw new Error('Permission denied for waiter assignment');
    }

    const table = await this.getTable(input);
    const waiterId = String(input.waiterId || '').trim();
    if (!waiterId) {
      throw new Error('waiterId is required');
    }

    if (table.currentWaiterId === waiterId) {
      return table;
    }

    const updated = await this.repository.updateTable({
      id: table.id,
      tenantId: table.tenantId,
      locationId: table.locationId,
      expectedVersion: table.version,
      currentWaiterId: waiterId,
      lastStatusChangedAt: new Date(String(table.lastStatusChangedAt)),
      lastStatusChangedBy: table.lastStatusChangedBy,
      updatedBy: input.assignedBy ?? null,
    });

    if (!updated) {
      throw new Error('Table update conflict');
    }

    await this.eventPublisher.publish({
      type: 'WaiterAssignedToTable',
      payload: {
        tableId: updated.id,
        tenantId: updated.tenantId,
        locationId: updated.locationId,
        waiterId,
        assignedBy: input.assignedBy ?? null,
        previousWaiterId: table.currentWaiterId ?? null,
      },
    });

    return updated;
  }

  async markCleaned(input: ChangeTableStatusInput): Promise<TableRecord> {
    if (!isOperationalRole(input.actorRole)) {
      throw new Error('Permission denied for cleaning operations');
    }

    const table = await this.getTable(input);
    if (isAvailableTableStatus(table.status)) {
      return table;
    }

    return this.updateStatus({ ...input, status: 'AVAILABLE' });
  }

  async enterMaintenance(input: ChangeTableStatusInput): Promise<TableRecord> {
    if (!isMaintenanceRole(input.actorRole)) {
      throw new Error('Permission denied for maintenance mode');
    }

    const table = await this.getTable(input);
    if (isMaintenanceTableStatus(table.status)) {
      return table;
    }

    return this.updateStatus({ ...input, status: 'MAINTENANCE' });
  }

  async exitMaintenance(input: RestoreMaintenanceInput): Promise<TableRecord> {
    if (!isMaintenanceRole(input.actorRole)) {
      throw new Error('Permission denied for maintenance mode');
    }

    const table = await this.getTable(input);
    if (isAvailableTableStatus(table.status)) {
      return table;
    }

    return this.updateStatus({
      tableId: input.tableId,
      tenantId: input.tenantId,
      locationId: input.locationId,
      status: 'AVAILABLE',
      changedBy: input.changedBy,
      actorRole: input.actorRole,
    });
  }

  private async publishStatusEvents(
    previous: TableRecord,
    next: TableRecord,
    changedBy: string | null,
    activeSessionId: string | null,
  ) {
    if (previous.status === next.status && previous.activeSessionId === next.activeSessionId) {
      return;
    }

    await this.eventPublisher.publish({
      type: 'TableStatusChanged',
      payload: {
        tableId: next.id,
        tenantId: next.tenantId,
        locationId: next.locationId,
        previousStatus: previous.status,
        nextStatus: next.status,
        changedBy,
        activeSessionId,
      },
    });

    if (next.status === 'OCCUPIED') {
      await this.eventPublisher.publish({
        type: 'TableOccupied',
        payload: {
          tableId: next.id,
          sessionId: activeSessionId || next.activeSessionId || '',
          tenantId: next.tenantId,
          locationId: next.locationId,
          previousStatus: previous.status,
          occupiedBy: changedBy,
        },
      });
    }

    if (next.status === 'CLEANING') {
      await this.eventPublisher.publish({
        type: 'TableCleaningStarted',
        payload: {
          tableId: next.id,
          tenantId: next.tenantId,
          locationId: next.locationId,
          previousStatus: previous.status,
          startedBy: changedBy,
        },
      });
    }

    if (next.status === 'AVAILABLE' && isCleaningTableStatus(previous.status)) {
      await this.eventPublisher.publish({
        type: 'TableAvailable',
        payload: {
          tableId: next.id,
          tenantId: next.tenantId,
          locationId: next.locationId,
          previousStatus: previous.status,
          completedBy: changedBy,
        },
      });
    }

    if (next.status === 'MAINTENANCE' && previous.status !== 'MAINTENANCE') {
      await this.eventPublisher.publish({
        type: 'TableMaintenanceStarted',
        payload: {
          tableId: next.id,
          tenantId: next.tenantId,
          locationId: next.locationId,
          previousStatus: previous.status,
          startedBy: changedBy,
        },
      });
    }

    if (previous.status === 'MAINTENANCE' && next.status === 'AVAILABLE') {
      await this.eventPublisher.publish({
        type: 'TableMaintenanceCompleted',
        payload: {
          tableId: next.id,
          tenantId: next.tenantId,
          locationId: next.locationId,
          previousStatus: previous.status,
          completedBy: changedBy,
        },
      });
    }
  }
}