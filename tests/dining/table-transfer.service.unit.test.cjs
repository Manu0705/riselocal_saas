const test = require('node:test');
const assert = require('node:assert/strict');

const { TableTransferService } = require('../../apps/api/dist/modules/dining/application/services/table-transfer.service');

class InMemoryTableTransferRepository {
  constructor() {
    this.sessions = [
      {
        id: 'session-1',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        tableId: 'table-12',
        status: 'ORDERING',
        assignedWaiterId: 'waiter-1',
        updatedBy: null,
      },
    ];

    this.tables = [
      {
        id: 'table-12',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        status: 'OCCUPIED',
        activeSessionId: 'session-1',
        currentWaiterId: 'waiter-1',
        lastStatusChangedBy: 'waiter-1',
        version: 1,
      },
      {
        id: 'table-18',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        status: 'AVAILABLE',
        activeSessionId: null,
        currentWaiterId: null,
        lastStatusChangedBy: 'waiter-1',
        version: 0,
      },
    ];

    this.transfers = [];
    this.assignments = [
      {
        id: 'assign-1',
        sessionId: 'session-1',
        tableId: 'table-12',
        status: 'ACTIVE',
        assignedAt: new Date(),
        releasedAt: null,
        assignedBy: 'waiter-1',
      },
    ];
  }

  async findSessionById(sessionId, tenantId, locationId) {
    return this.sessions.find((entry) => entry.id === sessionId && entry.tenantId === tenantId && entry.locationId === locationId) || null;
  }

  async findTableById(tableId, tenantId, locationId) {
    return this.tables.find((entry) => entry.id === tableId && entry.tenantId === tenantId && entry.locationId === locationId) || null;
  }

  async findTransferById(transferId, tenantId, locationId) {
    return this.transfers.find((entry) => entry.id === transferId && entry.tenantId === tenantId && entry.locationId === locationId) || null;
  }

  async createTransferRequest(input) {
    const created = {
      id: `transfer-${this.transfers.length + 1}`,
      sessionId: input.sessionId,
      fromTableId: input.fromTableId,
      toTableId: input.toTableId,
      requestedBy: input.requestedBy,
      reason: input.reason,
      status: 'REQUESTED',
      approvedBy: null,
      createdAt: new Date(),
      completedAt: null,
      tenantId: input.tenantId,
      locationId: input.locationId,
    };

    this.transfers.push(created);
    return created;
  }

  async updateTransferStatus(input) {
    const index = this.transfers.findIndex(
      (entry) => entry.id === input.transferId && entry.tenantId === input.tenantId && entry.locationId === input.locationId,
    );
    if (index < 0) {
      return null;
    }

    this.transfers[index] = {
      ...this.transfers[index],
      status: input.status,
      approvedBy: input.approvedBy || null,
      rejectedReason: input.rejectedReason || null,
      completedAt: input.completedAt || this.transfers[index].completedAt,
    };

    return this.transfers[index];
  }

  async executeApprovedTransfer(input) {
    const transfer = this.transfers.find(
      (entry) => entry.id === input.transferId && entry.tenantId === input.tenantId && entry.locationId === input.locationId,
    );
    if (!transfer) return null;

    const sessionIndex = this.sessions.findIndex((entry) => entry.id === transfer.sessionId);
    const fromIndex = this.tables.findIndex((entry) => entry.id === transfer.fromTableId);
    const toIndex = this.tables.findIndex((entry) => entry.id === transfer.toTableId);

    if (sessionIndex < 0 || fromIndex < 0 || toIndex < 0) return null;

    if (this.tables[toIndex].activeSessionId && this.tables[toIndex].activeSessionId !== transfer.sessionId) {
      return null;
    }

    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      tableId: transfer.toTableId,
      updatedBy: input.approvedBy,
    };

    this.tables[fromIndex] = {
      ...this.tables[fromIndex],
      status: 'CLEANING',
      activeSessionId: null,
      lastStatusChangedBy: input.approvedBy,
      version: this.tables[fromIndex].version + 1,
    };

    this.tables[toIndex] = {
      ...this.tables[toIndex],
      status: 'OCCUPIED',
      activeSessionId: transfer.sessionId,
      currentWaiterId: this.tables[fromIndex].currentWaiterId,
      lastStatusChangedBy: input.approvedBy,
      version: this.tables[toIndex].version + 1,
    };

    this.assignments = this.assignments.map((entry) => {
      if (entry.sessionId === transfer.sessionId && entry.status === 'ACTIVE') {
        return {
          ...entry,
          status: 'RELEASED',
          releasedAt: new Date(),
        };
      }

      return entry;
    });

    this.assignments.push({
      id: `assign-${this.assignments.length + 1}`,
      sessionId: transfer.sessionId,
      tableId: transfer.toTableId,
      status: 'ACTIVE',
      assignedAt: new Date(),
      releasedAt: null,
      assignedBy: input.approvedBy,
    });

    transfer.status = 'COMPLETED';
    transfer.approvedBy = input.approvedBy;
    transfer.completedAt = new Date();

    return {
      transfer,
      session: this.sessions[sessionIndex],
      fromTable: this.tables[fromIndex],
      toTable: this.tables[toIndex],
    };
  }

  async listHistoryBySession(sessionId, tenantId, locationId) {
    return {
      assignments: this.assignments.filter((entry) => entry.sessionId === sessionId),
      transfers: this.transfers.filter((entry) => entry.sessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId),
    };
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

test('TableTransferService requests and approves transfer while preserving session identity', async () => {
  const repository = new InMemoryTableTransferRepository();
  const publisher = new CapturingPublisher();
  const service = new TableTransferService(repository, publisher);

  const requested = await service.requestTransfer({
    sessionId: 'session-1',
    destinationTableId: 'table-18',
    reason: 'Customer requested quieter table',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    requestedBy: 'waiter-1',
    actorRole: 'waiter',
  });

  assert.equal(requested.status, 'REQUESTED');

  const approved = await service.approveTransfer({
    transferId: requested.id,
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    approvedBy: 'manager-1',
    actorRole: 'manager',
  });

  assert.equal(approved.session.id, 'session-1');
  assert.equal(approved.session.tableId, 'table-18');
  assert.equal(approved.fromTable.status, 'CLEANING');
  assert.equal(approved.toTable.status, 'OCCUPIED');
  assert.equal(publisher.events.some((event) => event.type === 'SessionTableChanged'), true);
  assert.equal(publisher.events.some((event) => event.type === 'TableTransferCompleted'), true);
});

test('TableTransferService rejects invalid destination requests', async () => {
  const repository = new InMemoryTableTransferRepository();
  repository.tables[1].status = 'MAINTENANCE';

  const publisher = new CapturingPublisher();
  const service = new TableTransferService(repository, publisher);

  await assert.rejects(
    () =>
      service.requestTransfer({
        sessionId: 'session-1',
        destinationTableId: 'table-18',
        reason: 'Move due to AC issue',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        requestedBy: 'waiter-1',
        actorRole: 'waiter',
      }),
    /under maintenance/i,
  );
});
