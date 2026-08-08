const test = require('node:test');
const assert = require('node:assert/strict');

const { TableGroupService } = require('../../apps/api/dist/modules/dining/application/services/table-group.service');

class InMemoryTableGroupRepository {
  constructor() {
    this.sessions = [{ id: 'session-1', tenantId: 'tenant-1', locationId: 'loc-1', tableId: 'table-12', status: 'ORDERING' }];
    this.tables = [
      { id: 'table-12', tenantId: 'tenant-1', locationId: 'loc-1', status: 'AVAILABLE', activeSessionId: null, currentWaiterId: null, lastStatusChangedBy: 'staff-1', version: 0 },
      { id: 'table-13', tenantId: 'tenant-1', locationId: 'loc-1', status: 'AVAILABLE', activeSessionId: null, currentWaiterId: null, lastStatusChangedBy: 'staff-1', version: 0 },
    ];
    this.groups = [];
    this.requests = [];
  }

  async findSessionById(sessionId, tenantId, locationId) { return this.sessions.find((entry) => entry.id === sessionId && entry.tenantId === tenantId && entry.locationId === locationId) || null; }
  async findTableById(tableId, tenantId, locationId) { return this.tables.find((entry) => entry.id === tableId && entry.tenantId === tenantId && entry.locationId === locationId) || null; }
  async findActiveGroupBySession(sessionId, tenantId, locationId) { return this.groups.find((entry) => entry.sessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId && entry.status === 'ACTIVE') || null; }
  async findMergeRequestById(mergeId, tenantId, locationId) { return this.requests.find((entry) => entry.id === mergeId && entry.tenantId === tenantId && entry.locationId === locationId) || null; }
  async createMergeRequest(input) { const request = { id: `merge-${this.requests.length + 1}`, ...input, status: 'REQUESTED', createdAt: new Date() }; this.requests.push(request); return request; }
  async updateMergeRequestStatus(input) { const match = this.requests.find((entry) => entry.id === input.mergeId); if (!match) return null; match.status = input.status; match.approvedBy = input.approvedBy || null; return match; }
  async createGroup(input) { const group = { id: `group-${this.groups.length + 1}`, ...input, status: 'ACTIVE', createdAt: new Date(), releasedAt: null }; this.groups.push(group); return group; }
  async addGroupMembers(groupId, tableIds) { return tableIds.map((tableId) => ({ id: `${groupId}-${tableId}`, tableGroupId: groupId, tableId, joinedAt: new Date(), releasedAt: null })); }
  async releaseGroup(groupId, tenantId, locationId, releasedBy) { const group = this.groups.find((entry) => entry.id === groupId && entry.tenantId === tenantId && entry.locationId === locationId); if (!group) return null; group.status = 'RELEASED'; group.releasedAt = new Date(); return group; }
  async findGroupById(groupId, tenantId, locationId) { return this.groups.find((entry) => entry.id === groupId && entry.tenantId === tenantId && entry.locationId === locationId) || null; }
  async listGroupHistory() { return []; }
}

class CapturingPublisher {
  constructor() { this.events = []; }
  async publish(event) { this.events.push(event); }
}

test('TableGroupService requests and approves a merge for a shared session', async () => {
  const repository = new InMemoryTableGroupRepository();
  const publisher = new CapturingPublisher();
  const service = new TableGroupService(repository, publisher);

  const request = await service.requestMerge({
    sessionId: 'session-1',
    tableIds: ['table-12', 'table-13'],
    reason: 'Large family group',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    requestedBy: 'receptionist-1',
    actorRole: 'reception',
  });

  assert.equal(request.status, 'REQUESTED');

  const approved = await service.approveMerge({
    mergeId: request.id,
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    approvedBy: 'manager-1',
    actorRole: 'manager',
  });

  assert.equal(approved.group.status, 'ACTIVE');
  assert.equal(publisher.events.some((event) => event.type === 'TableGroupCreated'), true);
  assert.equal(publisher.events.some((event) => event.type === 'TablesMerged'), true);
});

test('TableGroupService rejects merges for maintenance tables', async () => {
  const repository = new InMemoryTableGroupRepository();
  repository.tables[1].status = 'MAINTENANCE';
  const publisher = new CapturingPublisher();
  const service = new TableGroupService(repository, publisher);

  await assert.rejects(() => service.requestMerge({
    sessionId: 'session-1',
    tableIds: ['table-12', 'table-13'],
    reason: 'Large family group',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    requestedBy: 'receptionist-1',
    actorRole: 'reception',
  }), /under maintenance/i);
});
