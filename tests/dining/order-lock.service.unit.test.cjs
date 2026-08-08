const test = require('node:test');
const assert = require('node:assert/strict');

const { OrderLockService } = require('../../apps/api/dist/modules/dining/application/services/order-lock.service');

class InMemoryOrderLockRepository {
  constructor() {
    this.orders = [
      {
        id: 'order-1',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        sessionId: 'session-1',
        status: 'SUBMITTED',
        totalAmount: 800,
        version: 2,
        submittedAt: new Date(),
        roundId: 'round-1',
      },
    ];

    this.items = [
      {
        id: 'item-1',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        orderId: 'order-1',
        menuItemId: 'menu-1',
        quantity: 2,
        unitPrice: 400,
        subtotal: 800,
        kitchenStatus: 'PENDING',
        lockStatus: 'DRAFT',
        lockedAt: null,
        lockedBy: null,
        version: 0,
      },
    ];

    this.locks = [];
    this.lockEvents = [];
  }

  async findOrderById(orderId, tenantId, locationId) {
    return this.orders.find((entry) => entry.id === orderId && entry.tenantId === tenantId && entry.locationId === locationId) || null;
  }

  async findOrderLock(orderId, tenantId, locationId) {
    return this.locks.find((entry) => entry.orderId === orderId && entry.tenantId === tenantId && entry.locationId === locationId) || null;
  }

  async listOrderItems(orderId, tenantId, locationId) {
    return this.items.filter((entry) => entry.orderId === orderId && entry.tenantId === tenantId && entry.locationId === locationId);
  }

  async upsertOrderLock(input) {
    const index = this.locks.findIndex((entry) => entry.orderId === input.orderId && entry.tenantId === input.tenantId && entry.locationId === input.locationId);
    if (index >= 0) {
      this.locks[index] = {
        ...this.locks[index],
        status: input.status,
        lockedBy: input.lockedBy ?? null,
        lockedAt: input.lockedAt ?? null,
        reason: input.reason ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
        version: this.locks[index].version + 1,
      };
      return this.locks[index];
    }

    const created = {
      id: `lock-${this.locks.length + 1}`,
      orderId: input.orderId,
      tenantId: input.tenantId,
      locationId: input.locationId,
      status: input.status,
      lockedBy: input.lockedBy ?? null,
      lockedAt: input.lockedAt ?? null,
      reason: input.reason ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      version: 0,
    };
    this.locks.push(created);
    return created;
  }

  async updateOrderLock(input) {
    const index = this.locks.findIndex((entry) => entry.orderId === input.orderId && entry.tenantId === input.tenantId && entry.locationId === input.locationId);
    if (index < 0) return null;

    if (input.expectedVersion !== undefined && Number(this.locks[index].version) !== Number(input.expectedVersion)) {
      return null;
    }

    this.locks[index] = {
      ...this.locks[index],
      status: input.status,
      lockedBy: input.lockedBy ?? null,
      lockedAt: input.lockedAt ?? null,
      reason: input.reason ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      version: this.locks[index].version + 1,
    };

    return this.locks[index];
  }

  async updateOrderStatus(orderId, tenantId, locationId, status, _updatedBy, expectedVersion) {
    const index = this.orders.findIndex((entry) => entry.id === orderId && entry.tenantId === tenantId && entry.locationId === locationId);
    if (index < 0) return null;

    if (expectedVersion !== undefined && Number(this.orders[index].version) !== Number(expectedVersion)) {
      return null;
    }

    this.orders[index] = {
      ...this.orders[index],
      status,
      version: this.orders[index].version + 1,
    };

    return this.orders[index];
  }

  async updateOrderItemsLock(orderId, tenantId, locationId, lockStatus, lockedBy, lockedAt) {
    let count = 0;
    this.items = this.items.map((entry) => {
      if (entry.orderId === orderId && entry.tenantId === tenantId && entry.locationId === locationId) {
        count += 1;
        return {
          ...entry,
          lockStatus,
          lockedBy: lockedBy ?? null,
          lockedAt: lockedAt ?? null,
          version: entry.version + 1,
        };
      }

      return entry;
    });

    return count;
  }

  async createOrderLockEvent(input) {
    this.lockEvents.push({
      id: `evt-${this.lockEvents.length + 1}`,
      ...input,
      createdAt: new Date(),
    });
  }
}

class FakeSessionStateGateway {
  async getSessionState() {
    return { exists: true, status: 'ACTIVE' };
  }
}

class FakePublisher {
  constructor() {
    this.events = [];
  }

  async publish(event) {
    this.events.push(event);
  }
}

test('OrderLockService locks submitted order items and sets lock state', async () => {
  const repository = new InMemoryOrderLockRepository();
  const gateway = new FakeSessionStateGateway();
  const publisher = new FakePublisher();

  const service = new OrderLockService(repository, gateway, publisher);

  const result = await service.lockOrder({
    orderId: 'order-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    expectedVersion: 2,
    actorId: 'waiter-1',
    actorRole: 'waiter',
    idempotencyKey: 'idem-lock-1',
  });

  assert.equal(result.status, 'LOCKED');
  assert.equal(repository.orders[0].status, 'LOCKED');
  assert.equal(repository.items[0].lockStatus, 'LOCKED');
  assert.equal(publisher.events.some((event) => event.type === 'OrderLockRequested'), true);
  assert.equal(publisher.events.some((event) => event.type === 'OrderLocked'), true);
});

test('OrderLockService supports reopen-request and manager reopen flow', async () => {
  const repository = new InMemoryOrderLockRepository();
  const gateway = new FakeSessionStateGateway();
  const publisher = new FakePublisher();

  const service = new OrderLockService(repository, gateway, publisher);

  await service.lockOrder({
    orderId: 'order-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    expectedVersion: 2,
    actorId: 'waiter-1',
    actorRole: 'waiter',
    idempotencyKey: 'idem-lock-2',
  });

  const request = await service.requestReopen({
    orderId: 'order-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    actorId: 'waiter-1',
    actorRole: 'waiter',
    reason: 'Customer changed main course',
  });

  assert.equal(request.status, 'REOPEN_REQUESTED');

  const reopened = await service.reopenOrder({
    orderId: 'order-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    actorId: 'manager-1',
    actorRole: 'manager',
    reason: 'Approved correction',
  });

  assert.equal(reopened.status, 'REOPENED');
  assert.equal(repository.orders[0].status, 'REOPENED');
  assert.equal(repository.items[0].lockStatus, 'DRAFT');
  assert.equal(publisher.events.some((event) => event.type === 'OrderReopened'), true);
});
