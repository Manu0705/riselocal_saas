const test = require('node:test');
const assert = require('node:assert/strict');

const { TableService } = require('../../apps/api/dist/modules/dining/application/services/table.service');

class InMemoryTableRepository {
  constructor() {
    this.tables = [];
  }

  async findById(id, tenantId, locationId) {
    return this.tables.find((entry) => entry.id === id && entry.tenantId === tenantId && entry.locationId === locationId) || null;
  }

  async findAllByLocation(tenantId, locationId, status) {
    return this.tables.filter(
      (entry) =>
        entry.tenantId === tenantId &&
        entry.locationId === locationId &&
        (!status || entry.status === status),
    );
  }

  async findByActiveSessionId(sessionId, tenantId, locationId) {
    return this.tables.find(
      (entry) => entry.activeSessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId,
    ) || null;
  }

  async createTable(input) {
    const now = new Date();
    const record = {
      id: `table-${this.tables.length + 1}`,
      tenantId: input.tenantId,
      locationId: input.locationId,
      areaId: input.areaId,
      name: input.name,
      capacity: input.capacity,
      status: input.status || 'AVAILABLE',
      activeSessionId: input.activeSessionId ?? null,
      currentWaiterId: input.currentWaiterId ?? null,
      lastStatusChangedAt: input.lastStatusChangedAt || now,
      lastStatusChangedBy: input.lastStatusChangedBy,
      version: input.version || 0,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy || null,
      updatedBy: input.updatedBy || null,
      deletedAt: null,
    };

    this.tables.push(record);
    return record;
  }

  async updateTable(input) {
    const index = this.tables.findIndex(
      (entry) =>
        entry.id === input.id &&
        entry.tenantId === input.tenantId &&
        entry.locationId === input.locationId &&
        entry.version === input.expectedVersion,
    );

    if (index < 0) {
      return null;
    }

    const current = this.tables[index];
    const next = {
      ...current,
      ...(input.status ? { status: input.status } : {}),
      ...(input.activeSessionId !== undefined ? { activeSessionId: input.activeSessionId } : {}),
      ...(input.currentWaiterId !== undefined ? { currentWaiterId: input.currentWaiterId } : {}),
      lastStatusChangedAt: input.lastStatusChangedAt || new Date(),
      ...(input.lastStatusChangedBy ? { lastStatusChangedBy: input.lastStatusChangedBy } : {}),
      updatedBy: input.updatedBy ?? null,
      updatedAt: new Date(),
      version: current.version + 1,
    };

    this.tables[index] = next;
    return next;
  }
}

class CapturingPublisher {
  constructor() {
    this.events = [];
  }

  async publish(event) {
    this.events.push(event);
  }
}

test('TableService rejects invalid transitions and emits occupied event', async () => {
  const repo = new InMemoryTableRepository();
  const publisher = new CapturingPublisher();
  const service = new TableService(repo, publisher);

  const table = await repo.createTable({
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    areaId: 'area-1',
    name: 'T1',
    capacity: 4,
    lastStatusChangedBy: 'u1',
  });

  await assert.rejects(
    () =>
      service.updateStatus({
        tableId: table.id,
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        status: 'BILLING',
        actorRole: 'staff',
        changedBy: 'u2',
      }),
    /Invalid table transition/i,
  );

  const updated = await service.updateStatus({
    tableId: table.id,
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    status: 'OCCUPIED',
    activeSessionId: 'session-1',
    actorRole: 'staff',
    changedBy: 'u2',
  });

  assert.equal(updated.status, 'OCCUPIED');
  assert.equal(updated.activeSessionId, 'session-1');
  assert.equal(publisher.events.at(-1).type, 'TableOccupied');
});

test('TableService blocks maintenance for non-management roles', async () => {
  const repo = new InMemoryTableRepository();
  const publisher = new CapturingPublisher();
  const service = new TableService(repo, publisher);

  const table = await repo.createTable({
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    areaId: 'area-1',
    name: 'T2',
    capacity: 2,
    lastStatusChangedBy: 'u1',
  });

  await assert.rejects(
    () =>
      service.enterMaintenance({
        tableId: table.id,
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        status: 'MAINTENANCE',
        actorRole: 'staff',
        changedBy: 'u2',
      }),
    /Permission denied/i,
  );
});