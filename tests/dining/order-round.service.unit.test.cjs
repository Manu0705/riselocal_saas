const test = require('node:test');
const assert = require('node:assert/strict');

const { MenuAggregate } = require('../../apps/api/dist/modules/dining/domain/menu.aggregate');
const { CategoryEntity } = require('../../apps/api/dist/modules/dining/domain/category.entity');
const { ItemEntity } = require('../../apps/api/dist/modules/dining/domain/item.entity');
const { VariantEntity } = require('../../apps/api/dist/modules/dining/domain/variant.entity');
const { ModifierEntity } = require('../../apps/api/dist/modules/dining/domain/modifier.entity');
const { PricingEntity } = require('../../apps/api/dist/modules/dining/domain/pricing.entity');
const { AvailabilityEntity } = require('../../apps/api/dist/modules/dining/domain/availability.entity');
const { OrderRoundService } = require('../../apps/api/dist/modules/dining/application/services/order-round.service');

class InMemoryMenuRepository {
  constructor() {
    this.store = new Map();
  }

  key(id, tenantId, locationId) {
    return `${tenantId}:${locationId}:${id}`;
  }

  async save(menu) {
    const snapshot = menu.toJSON();
    this.store.set(this.key(snapshot.menu.id, snapshot.menu.tenantId, snapshot.menu.locationId), snapshot);
  }

  async update(menu) {
    return this.save(menu);
  }

  async findById(id, tenantId, locationId) {
    const snapshot = this.store.get(this.key(id, tenantId, locationId));
    return snapshot ? MenuAggregate.fromPersistence(snapshot) : null;
  }

  async findAllByLocation(tenantId, locationId) {
    const prefix = `${tenantId}:${locationId}:`;
    return [...this.store.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([, snapshot]) => MenuAggregate.fromPersistence(snapshot));
  }

  async softDelete() {}
}

class InMemoryCartRepository {
  constructor() {
    this.carts = [];
    this.items = [];
    this.snapshots = [];
  }

  async findActiveBySession(sessionId, tenantId, locationId) {
    return this.carts.find((entry) => entry.sessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId && entry.status === 'ACTIVE' && entry.deletedAt === null) || null;
  }

  async findById(id, tenantId, locationId) {
    return this.carts.find((entry) => entry.id === id && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null) || null;
  }

  async findBySessionAndRound(sessionId, roundNumber, tenantId, locationId) {
    return this.carts.find((entry) => entry.sessionId === sessionId && entry.roundNumber === roundNumber && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null) || null;
  }

  async createCart(input) {
    const now = new Date();
    const record = {
      id: `cart-${this.carts.length + 1}`,
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: input.sessionId,
      roundNumber: input.roundNumber,
      status: input.status || 'ACTIVE',
      subtotal: 0,
      total: 0,
      version: input.version || 0,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy || null,
      updatedBy: input.updatedBy || null,
      deletedAt: null,
    };
    this.carts.push(record);
    return record;
  }

  async updateCart(input) {
    const index = this.carts.findIndex((entry) => entry.id === input.id && entry.tenantId === input.tenantId && entry.locationId === input.locationId && entry.deletedAt === null && entry.version === input.expectedVersion);
    if (index < 0) return null;

    const next = {
      ...this.carts[index],
      ...(input.status ? { status: input.status } : {}),
      ...(input.subtotal !== undefined ? { subtotal: input.subtotal } : {}),
      ...(input.total !== undefined ? { total: input.total } : {}),
      updatedBy: input.updatedBy ?? null,
      updatedAt: new Date(),
      version: this.carts[index].version + 1,
    };

    this.carts[index] = next;
    return next;
  }

  async listItems(cartId, tenantId, locationId) {
    return this.items.filter((entry) => entry.cartId === cartId && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null);
  }

  async findItemById(id, tenantId, locationId) {
    return this.items.find((entry) => entry.id === id && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null) || null;
  }

  async createItem(input) {
    const now = new Date();
    const record = {
      id: `item-${this.items.length + 1}`,
      tenantId: input.tenantId,
      locationId: input.locationId,
      cartId: input.cartId,
      menuItemId: input.menuItemId,
      variantId: input.variantId ?? null,
      quantity: input.quantity,
      notes: input.notes ?? null,
      modifiers: input.modifiers ?? [],
      unitPrice: input.unitPrice,
      subtotal: input.subtotal,
      addedBy: input.addedBy ?? null,
      addedAt: now,
      updatedBy: input.addedBy ?? null,
      updatedAt: now,
      status: input.status || 'DRAFT',
      deletedAt: null,
      version: 0,
    };
    this.items.push(record);
    return record;
  }

  async updateItem(input) {
    const index = this.items.findIndex((entry) => entry.id === input.id && entry.tenantId === input.tenantId && entry.locationId === input.locationId && entry.deletedAt === null && entry.version === input.expectedVersion);
    if (index < 0) return null;

    const next = {
      ...this.items[index],
      quantity: input.quantity,
      notes: input.notes ?? null,
      modifiers: input.modifiers ?? [],
      unitPrice: input.unitPrice,
      subtotal: input.subtotal,
      ...(input.status ? { status: input.status } : {}),
      updatedBy: input.updatedBy ?? null,
      updatedAt: new Date(),
      version: this.items[index].version + 1,
    };

    this.items[index] = next;
    return next;
  }

  async deleteItem(id, tenantId, locationId) {
    const index = this.items.findIndex((entry) => entry.id === id && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null);
    if (index < 0) return null;
    const deleted = { ...this.items[index], status: 'REMOVED', deletedAt: new Date(), version: this.items[index].version + 1 };
    this.items[index] = deleted;
    return deleted;
  }

  async createSnapshot(input) {
    const record = { ...input, id: `snap-${this.snapshots.length + 1}`, createdAt: new Date() };
    this.snapshots.push(record);
    return record;
  }

  async listSnapshots(cartId, tenantId, locationId) {
    return this.snapshots.filter((entry) => entry.cartId === cartId && entry.tenantId === tenantId && entry.locationId === locationId);
  }

  async findActiveCartRound(sessionId, tenantId, locationId) {
    const matches = this.carts.filter((entry) => entry.sessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId);
    return matches.reduce((max, entry) => Math.max(max, entry.roundNumber), 0);
  }
}

class InMemoryOrderRoundRepository {
  constructor() {
    this.rounds = [];
    this.orders = [];
    this.items = [];
  }

  async findDraftBySession(sessionId, tenantId, locationId) {
    return this.rounds.find((entry) => entry.sessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId && entry.status === 'DRAFT' && entry.deletedAt === null) || null;
  }

  async findById(id, tenantId, locationId) {
    return this.rounds.find((entry) => entry.id === id && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null) || null;
  }

  async listBySession(sessionId, tenantId, locationId) {
    return this.rounds
      .filter((entry) => entry.sessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null)
      .sort((a, b) => a.roundNumber - b.roundNumber);
  }

  async findMaxRoundNumber(sessionId, tenantId, locationId) {
    const rounds = this.rounds.filter((entry) => entry.sessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null);
    return rounds.reduce((max, entry) => Math.max(max, entry.roundNumber), 0);
  }

  async createRound(input) {
    const now = new Date();
    const record = {
      id: `round-${this.rounds.length + 1}`,
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: input.sessionId,
      draftCartId: input.draftCartId,
      roundNumber: input.roundNumber,
      status: input.status || 'DRAFT',
      submittedBy: null,
      submittedAt: null,
      cancelledBy: null,
      cancelledAt: null,
      idempotencyKey: null,
      version: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy ?? null,
      updatedBy: input.createdBy ?? null,
      deletedAt: null,
    };

    this.rounds.push(record);
    return record;
  }

  async updateRound(input) {
    const index = this.rounds.findIndex((entry) => entry.id === input.id && entry.tenantId === input.tenantId && entry.locationId === input.locationId && entry.deletedAt === null && entry.version === input.expectedVersion);
    if (index < 0) return null;

    const next = {
      ...this.rounds[index],
      ...(input.status ? { status: input.status } : {}),
      ...(input.submittedBy !== undefined ? { submittedBy: input.submittedBy } : {}),
      ...(input.submittedAt !== undefined ? { submittedAt: input.submittedAt } : {}),
      ...(input.cancelledBy !== undefined ? { cancelledBy: input.cancelledBy } : {}),
      ...(input.cancelledAt !== undefined ? { cancelledAt: input.cancelledAt } : {}),
      ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
      updatedBy: input.updatedBy ?? null,
      updatedAt: new Date(),
      version: this.rounds[index].version + 1,
    };

    this.rounds[index] = next;
    return next;
  }

  async findOrderByRound(roundId, tenantId, locationId) {
    return this.orders.find((entry) => entry.roundId === roundId && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null) || null;
  }

  async createOrder(input) {
    const now = new Date();
    const record = {
      id: `order-${this.orders.length + 1}`,
      tenantId: input.tenantId,
      locationId: input.locationId,
      roundId: input.roundId,
      sessionId: input.sessionId,
      status: input.status || 'SUBMITTED',
      totalAmount: input.totalAmount,
      submittedAt: input.submittedAt,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy ?? null,
      updatedBy: input.createdBy ?? null,
      deletedAt: null,
      version: 0,
    };

    this.orders.push(record);
    return record;
  }

  async updateOrderStatus(orderId, tenantId, locationId, status, updatedBy) {
    const index = this.orders.findIndex((entry) => entry.id === orderId && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null);
    if (index < 0) return null;

    const next = {
      ...this.orders[index],
      status,
      updatedBy: updatedBy ?? null,
      updatedAt: new Date(),
      version: this.orders[index].version + 1,
    };
    this.orders[index] = next;
    return next;
  }

  async createOrderItems(inputs) {
    const now = new Date();
    const created = inputs.map((input, index) => ({
      id: `order-item-${this.items.length + index + 1}`,
      tenantId: input.tenantId,
      locationId: input.locationId,
      orderId: input.orderId,
      menuItemId: input.menuItemId,
      itemSnapshot: input.itemSnapshot,
      priceSnapshot: input.priceSnapshot,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      subtotal: input.subtotal,
      kitchenStatus: input.kitchenStatus || 'PENDING',
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy ?? null,
      updatedBy: input.createdBy ?? null,
      deletedAt: null,
      version: 0,
    }));

    this.items.push(...created);
    return created;
  }

  async listOrdersBySession(sessionId, tenantId, locationId) {
    return this.orders.filter((entry) => entry.sessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null);
  }

  async listOrderItemsByOrderIds(orderIds, tenantId, locationId) {
    return this.items.filter((entry) => orderIds.includes(entry.orderId) && entry.tenantId === tenantId && entry.locationId === locationId && entry.deletedAt === null);
  }
}

class FakeSessionStateGateway {
  constructor() {
    this.status = 'ACTIVE';
  }

  async getSessionState() {
    return { exists: true, status: this.status };
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

function seedMenu() {
  const tenantId = 'tenant-1';
  const locationId = 'loc-1';
  const menu = MenuAggregate.create({ tenantId, locationId, name: 'Dinner', createdBy: 'seed' });
  const category = CategoryEntity.create({ tenantId, locationId, menuId: menu.id, name: 'Mains', createdBy: 'seed' });
  const item = ItemEntity.create({ tenantId, locationId, categoryId: category.id, name: 'Burger', basePrice: 250, createdBy: 'seed' });
  const variant = VariantEntity.create({ tenantId, locationId, itemId: item.id, name: 'Large', priceAdjustment: 50, createdBy: 'seed' });
  const modifier = ModifierEntity.create({ tenantId, locationId, itemId: item.id, name: 'No Onion', createdBy: 'seed' });
  const pricing = PricingEntity.create({ tenantId, locationId, itemId: item.id, variantId: variant.id, amount: 300, createdBy: 'seed' });
  const availability = AvailabilityEntity.create({ tenantId, locationId, itemId: item.id, status: 'AVAILABLE', updatedBy: 'seed' });

  menu.addCategory(category);
  menu.addItem(item);
  menu.addVariant(variant);
  menu.addModifier(modifier);
  menu.addPrice(pricing);
  menu.addAvailability(availability);

  return { menu, item, variant, modifier };
}

test('OrderRoundService creates a draft round and submits it into an order', async () => {
  const cartRepository = new InMemoryCartRepository();
  const orderRoundRepository = new InMemoryOrderRoundRepository();
  const menuRepository = new InMemoryMenuRepository();
  const sessionGateway = new FakeSessionStateGateway();
  const publisher = new CapturingPublisher();

  const service = new OrderRoundService(
    orderRoundRepository,
    cartRepository,
    menuRepository,
    sessionGateway,
    publisher,
  );

  const seeded = seedMenu();
  await menuRepository.save(seeded.menu);

  const created = await service.createRound({
    sessionId: 'session-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    actorId: 'u-1',
    actorRole: 'customer',
  });

  await cartRepository.createItem({
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    cartId: created.cart.id,
    menuItemId: seeded.item.id,
    variantId: seeded.variant.id,
    quantity: 2,
    notes: 'Extra spicy',
    modifiers: [{ id: seeded.modifier.id, name: seeded.modifier.toJSON().name, value: true }],
    unitPrice: 300,
    subtotal: 600,
    addedBy: 'u-1',
    status: 'DRAFT',
  });

  const submission = await service.submitRound({
    roundId: created.round.id,
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    actorId: 'u-1',
    actorRole: 'customer',
    idempotencyKey: 'idem-1',
  });

  assert.equal(submission.round.status, 'SUBMITTED');
  assert.equal(submission.order.totalAmount, 600);
  assert.equal(submission.archivedCart.status, 'ARCHIVED');
  assert.equal(submission.nextCart.roundNumber, created.round.roundNumber + 1);
  assert.equal(publisher.events.some((event) => event.type === 'OrderRoundSubmitted'), true);
  assert.equal(publisher.events.some((event) => event.type === 'OrderCreated'), true);
});

test('OrderRoundService restricts round cancellation to manager roles', async () => {
  const cartRepository = new InMemoryCartRepository();
  const orderRoundRepository = new InMemoryOrderRoundRepository();
  const menuRepository = new InMemoryMenuRepository();
  const sessionGateway = new FakeSessionStateGateway();
  const publisher = new CapturingPublisher();

  const service = new OrderRoundService(
    orderRoundRepository,
    cartRepository,
    menuRepository,
    sessionGateway,
    publisher,
  );

  const created = await service.createRound({
    sessionId: 'session-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    actorId: 'u-1',
    actorRole: 'customer',
  });

  await assert.rejects(
    () =>
      service.cancelRound({
        roundId: created.round.id,
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        actorId: 'u-2',
        actorRole: 'waiter',
      }),
    /Permission denied/i,
  );
});