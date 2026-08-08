const test = require('node:test');
const assert = require('node:assert/strict');

const {
  OrderModificationService,
} = require('../../apps/api/dist/modules/dining/application/services/order-modification.service');

class InMemoryOrderModificationRepository {
  constructor() {
    this.orders = [
      {
        id: 'order-1',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        sessionId: 'session-1',
        status: 'LOCKED',
        totalAmount: 1200,
        version: 1,
      },
    ];

    this.items = [
      {
        id: 'order-item-1',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        orderId: 'order-1',
        quantity: 2,
        subtotal: 600,
        unitPrice: 300,
        kitchenStatus: 'PENDING',
        lockStatus: 'LOCKED',
        itemSnapshot: {},
        priceSnapshot: {},
        version: 0,
      },
      {
        id: 'order-item-2',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        orderId: 'order-1',
        quantity: 2,
        subtotal: 600,
        unitPrice: 300,
        kitchenStatus: 'READY',
        lockStatus: 'LOCKED',
        itemSnapshot: {},
        priceSnapshot: {},
        version: 0,
      },
    ];

    this.modifications = [];
    this.adjustments = [];
  }

  async findOrderById(orderId, tenantId, locationId) {
    return this.orders.find((entry) => entry.id === orderId && entry.tenantId === tenantId && entry.locationId === locationId) || null;
  }

  async findOrderItemById(orderItemId, tenantId, locationId) {
    return this.items.find((entry) => entry.id === orderItemId && entry.tenantId === tenantId && entry.locationId === locationId) || null;
  }

  async findModificationById(modificationId, tenantId, locationId) {
    return this.modifications.find((entry) => entry.id === modificationId && entry.tenantId === tenantId && entry.locationId === locationId) || null;
  }

  async findModificationByIdempotency(orderId, tenantId, locationId, idempotencyKey) {
    return this.modifications.find(
      (entry) =>
        entry.orderId === orderId &&
        entry.tenantId === tenantId &&
        entry.locationId === locationId &&
        entry.idempotencyKey === idempotencyKey,
    ) || null;
  }

  async createModificationRequest(input) {
    const created = {
      id: `mod-${this.modifications.length + 1}`,
      tenantId: input.tenantId,
      locationId: input.locationId,
      orderId: input.orderId,
      sessionId: input.sessionId,
      requestedBy: input.requestedBy,
      reason: input.reason,
      status: input.status || 'REQUESTED',
      approvedBy: input.approvedBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: input.completedAt || null,
      idempotencyKey: input.idempotencyKey || null,
    };

    this.modifications.push(created);
    return created;
  }

  async updateModificationRequest(input) {
    const index = this.modifications.findIndex(
      (entry) => entry.id === input.id && entry.tenantId === input.tenantId && entry.locationId === input.locationId,
    );

    if (index < 0) {
      return null;
    }

    this.modifications[index] = {
      ...this.modifications[index],
      status: input.status,
      approvedBy: input.approvedBy || null,
      completedAt: input.completedAt || null,
      rejectedReason: input.rejectedReason || null,
      updatedAt: new Date(),
    };

    return this.modifications[index];
  }

  async createAdjustment(input) {
    const created = {
      id: `adj-${this.adjustments.length + 1}`,
      tenantId: input.tenantId,
      locationId: input.locationId,
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      modificationRequestId: input.modificationRequestId,
      type: input.type,
      oldValue: input.oldValue || null,
      newValue: input.newValue || null,
      reason: input.reason,
      createdBy: input.createdBy,
      createdAt: new Date(),
    };

    this.adjustments.push(created);
    return created;
  }

  async listModificationsByOrder(orderId, tenantId, locationId) {
    return this.modifications.filter((entry) => entry.orderId === orderId && entry.tenantId === tenantId && entry.locationId === locationId);
  }

  async listAdjustmentsByModificationIds(modificationIds, tenantId, locationId) {
    return this.adjustments.filter(
      (entry) =>
        modificationIds.includes(entry.modificationRequestId) &&
        entry.tenantId === tenantId &&
        entry.locationId === locationId,
    );
  }

  async updateOrderItemAsCancelled(orderItemId, tenantId, locationId) {
    const index = this.items.findIndex(
      (entry) => entry.id === orderItemId && entry.tenantId === tenantId && entry.locationId === locationId,
    );

    if (index < 0) {
      return null;
    }

    this.items[index] = {
      ...this.items[index],
      kitchenStatus: 'CANCELLED',
      version: this.items[index].version + 1,
    };

    return this.items[index];
  }

  async updateOrderTotal(orderId, tenantId, locationId, totalAmount) {
    const index = this.orders.findIndex((entry) => entry.id === orderId && entry.tenantId === tenantId && entry.locationId === locationId);
    if (index >= 0) {
      this.orders[index] = {
        ...this.orders[index],
        totalAmount,
      };
    }
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

test('OrderModificationService requests and approves cancellation with audit events', async () => {
  const repository = new InMemoryOrderModificationRepository();
  const gateway = new FakeSessionStateGateway();
  const publisher = new FakePublisher();
  const service = new OrderModificationService(repository, gateway, publisher);

  const requested = await service.requestModification({
    orderId: 'order-1',
    orderItemId: 'order-item-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    requestedBy: 'waiter-1',
    actorRole: 'waiter',
    reason: 'Customer changed mind',
    adjustmentType: 'CANCEL',
    idempotencyKey: 'idem-mod-1',
  });

  assert.equal(requested.status, 'REQUESTED');
  assert.equal(repository.adjustments.length, 1);

  const approved = await service.approveModification({
    modificationId: requested.id,
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    approvedBy: 'manager-1',
    actorRole: 'manager',
  });

  assert.equal(approved.status, 'COMPLETED');
  assert.equal(repository.items[0].kitchenStatus, 'CANCELLED');
  assert.equal(repository.orders[0].totalAmount, 600);
  assert.equal(publisher.events.some((event) => event.type === 'OrderModificationRequested'), true);
  assert.equal(publisher.events.some((event) => event.type === 'OrderItemCancelled'), true);
  assert.equal(publisher.events.some((event) => event.type === 'OrderModified'), true);
});

test('OrderModificationService rejects modification with mandatory manager approval', async () => {
  const repository = new InMemoryOrderModificationRepository();
  const gateway = new FakeSessionStateGateway();
  const publisher = new FakePublisher();
  const service = new OrderModificationService(repository, gateway, publisher);

  const requested = await service.requestModification({
    orderId: 'order-1',
    orderItemId: 'order-item-2',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    requestedBy: 'customer-1',
    actorRole: 'customer',
    reason: 'No longer needed',
    adjustmentType: 'CANCEL',
  });

  await assert.rejects(
    () =>
      service.rejectModification({
        modificationId: requested.id,
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        rejectedBy: 'waiter-1',
        actorRole: 'waiter',
        reason: 'Denied',
      }),
    /Permission denied/i,
  );

  const rejected = await service.rejectModification({
    modificationId: requested.id,
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    rejectedBy: 'manager-1',
    actorRole: 'manager',
    reason: 'Kitchen already plated item',
  });

  assert.equal(rejected.status, 'REJECTED');
  assert.equal(publisher.events.some((event) => event.type === 'OrderModificationRejected'), true);
});
