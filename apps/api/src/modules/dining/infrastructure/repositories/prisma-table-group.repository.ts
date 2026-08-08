import { prisma } from '@saas/database';
import type {
  TableGroup,
  TableGroupMember,
  TableMergeRequest,
} from '@saas/domain-core/dining/table-group.contract';
import type {
  CreateMergeRequestInput,
  CreateTableGroupInput,
  TableGroupRepository,
  UpdateMergeRequestStatusInput,
} from '../../application/contracts/table-group.repository';

function mapGroup(record: any): TableGroup {
  return {
    id: record.id,
    tenantId: record.tenantId,
    locationId: record.locationId,
    sessionId: record.sessionId,
    status: record.status,
    createdAt: record.createdAt,
    releasedAt: record.releasedAt ?? null,
    createdBy: record.createdBy,
  };
}

function mapMember(record: any): TableGroupMember {
  return {
    id: record.id,
    tableGroupId: record.tableGroupId,
    tableId: record.tableId,
    joinedAt: record.joinedAt,
    releasedAt: record.releasedAt ?? null,
  };
}

function mapMergeRequest(record: any): TableMergeRequest {
  return {
    id: record.id,
    sessionId: record.sessionId,
    tableIds: Array.isArray(record.tableIds) ? record.tableIds : [],
    requestedBy: record.requestedBy,
    reason: record.reason,
    status: record.status,
    approvedBy: record.approvedBy ?? null,
    createdAt: record.createdAt,
  };
}

export class PrismaTableGroupRepository implements TableGroupRepository {
  async findSessionById(sessionId: string, tenantId: string, locationId: string) {
    const record = await prisma.diningSession.findFirst({
      where: { id: sessionId, tenantId, locationId, deletedAt: null },
    });
    return record ? { id: record.id, tenantId: record.tenantId, locationId: record.locationId, tableId: record.tableId, status: record.status, assignedWaiterId: record.assignedWaiterId ?? null, updatedBy: record.updatedBy ?? null } : null;
  }

  async findTableById(tableId: string, tenantId: string, locationId: string) {
    const record = await prisma.diningTable.findFirst({
      where: { id: tableId, tenantId, locationId, deletedAt: null },
    });
    return record ? { id: record.id, tenantId: record.tenantId, locationId: record.locationId, status: record.status, activeSessionId: record.activeSessionId ?? null, currentWaiterId: record.currentWaiterId ?? null, lastStatusChangedBy: record.lastStatusChangedBy ?? null, version: Number(record.version ?? 0) } : null;
  }

  async findActiveGroupBySession(sessionId: string, tenantId: string, locationId: string) {
    const record = await prisma.diningTableGroup.findFirst({
      where: { sessionId, tenantId, locationId, status: 'ACTIVE' },
    });
    return record ? mapGroup(record) : null;
  }

  async findMergeRequestById(mergeId: string, tenantId: string, locationId: string): Promise<TableMergeRequest | null> {
    const record = await prisma.diningTableMergeRequest.findFirst({
      where: { id: mergeId, tenantId, locationId },
    });
    return record ? mapMergeRequest(record) : null;
  }

  async createMergeRequest(input: CreateMergeRequestInput): Promise<TableMergeRequest> {
    const record = await prisma.diningTableMergeRequest.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        sessionId: input.sessionId,
        tableIds: input.tableIds,
        requestedBy: input.requestedBy,
        reason: input.reason,
        status: 'REQUESTED',
      },
    });
    return mapMergeRequest(record);
  }

  async updateMergeRequestStatus(input: UpdateMergeRequestStatusInput): Promise<TableMergeRequest | null> {
    const existing = await prisma.diningTableMergeRequest.findFirst({
      where: { id: input.mergeId, tenantId: input.tenantId, locationId: input.locationId },
    });
    if (!existing) return null;
    const updated = await prisma.diningTableMergeRequest.update({
      where: { id: input.mergeId },
      data: { status: input.status, approvedBy: input.approvedBy ?? null },
    });
    return mapMergeRequest(updated);
  }

  async createGroup(input: CreateTableGroupInput): Promise<TableGroup> {
    const record = await prisma.diningTableGroup.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        sessionId: input.sessionId,
        status: 'ACTIVE',
        createdBy: input.createdBy,
      },
    });
    return mapGroup(record);
  }

  async addGroupMembers(groupId: string, tableIds: string[], tenantId: string): Promise<TableGroupMember[]> {
    const created = [] as TableGroupMember[];
    for (const tableId of tableIds) {
      const record = await prisma.diningTableGroupMember.create({
        data: {
          tenantId,
          tableGroupId: groupId,
          tableId,
        },
      });
      created.push(mapMember(record));
    }
    return created;
  }

  async releaseGroup(groupId: string, tenantId: string, locationId: string, releasedBy: string): Promise<TableGroup | null> {
    const existing = await prisma.diningTableGroup.findFirst({ where: { id: groupId, tenantId, locationId } });
    if (!existing) return null;
    const updated = await prisma.diningTableGroup.update({
      where: { id: groupId },
      data: { status: 'RELEASED', releasedAt: new Date() },
    });
    return mapGroup(updated);
  }

  async findGroupById(groupId: string, tenantId: string, locationId: string): Promise<TableGroup | null> {
    const record = await prisma.diningTableGroup.findFirst({ where: { id: groupId, tenantId, locationId } });
    return record ? mapGroup(record) : null;
  }

  async listGroupHistory(sessionId: string, tenantId: string, locationId: string) {
    const groups = await prisma.diningTableGroup.findMany({
      where: { sessionId, tenantId, locationId },
      include: { members: true },
    });
    const request = await prisma.diningTableMergeRequest.findFirst({ where: { sessionId, tenantId, locationId } });
    return groups.map((group) => ({
      group: mapGroup(group),
      members: group.members.map(mapMember),
      request: request ? mapMergeRequest(request) : null,
    }));
  }
}
