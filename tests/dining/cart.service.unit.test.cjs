const test = require('node:test');
const assert = require('node:assert/strict');

const { MenuAggregate } = require('../../apps/api/dist/modules/dining/domain/menu.aggregate');
const { CategoryEntity } = require('../../apps/api/dist/modules/dining/domain/category.entity');
const { ItemEntity } = require('../../apps/api/dist/modules/dining/domain/item.entity');
const { VariantEntity } = require('../../apps/api/dist/modules/dining/domain/variant.entity');
const { ModifierEntity } = require('../../apps/api/dist/modules/dining/domain/modifier.entity');
const { PricingEntity } = require('../../apps/api/dist/modules/dining/domain/pricing.entity');
const { AvailabilityEntity } = require('../../apps/api/dist/modules/dining/domain/availability.entity');
const { CartService } = require('../../apps/api/dist/modules/dining/application/services/cart.service');

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
    return this.carts.find((entry) => entry.sessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId && entry.status === 'ACTIVE') || null;
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

test('CartService adds an item and creates a snapshot', async () => {
  const repo = new InMemoryCartRepository();
  const menuRepo = new InMemoryMenuRepository();
  const sessionGateway = new FakeSessionStateGateway();
  const publisher = new CapturingPublisher();
  const service = new CartService(repo, menuRepo, sessionGateway, publisher);

  const seeded = seedMenu();
  await menuRepo.save(seeded.menu);

  const result = await service.addItem({
    sessionId: 'session-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    menuItemId: seeded.item.id,
    variantId: seeded.variant.id,
    quantity: 2,
    notes: 'Extra spicy',
    modifiers: [{ id: seeded.modifier.id, name: seeded.modifier.toJSON().name, value: true }],
    actorRole: 'customer',
    addedBy: 'user-1',
  });

  assert.equal(result.cart.status, 'ACTIVE');
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].subtotal, 600);
  assert.equal(repo.snapshots.length, 1);
  assert.equal(publisher.events[0].type, 'CartCreated');
  assert.equal(publisher.events.at(-1).type, 'CartItemAdded');
});

test('CartService rejects submission on closed sessions', async () => {
  const repo = new InMemoryCartRepository();
  const menuRepo = new InMemoryMenuRepository();
  const sessionGateway = new FakeSessionStateGateway();
  sessionGateway.status = 'CLOSED';
  const publisher = new CapturingPublisher();
  const service = new CartService(repo, menuRepo, sessionGateway, publisher);

  await assert.rejects(
    () =>
      service.getActiveCart({
        sessionId: 'session-1',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
      }),
    /Session is closed or archived/i,
  );
});