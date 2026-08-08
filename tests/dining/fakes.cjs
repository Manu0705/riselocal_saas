const { MenuAggregate } = require('../../apps/api/dist/modules/dining/domain/menu.aggregate');
const { CategoryEntity } = require('../../apps/api/dist/modules/dining/domain/category.entity');
const { ItemEntity } = require('../../apps/api/dist/modules/dining/domain/item.entity');

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
    const snapshot = menu.toJSON();
    this.store.set(this.key(snapshot.menu.id, snapshot.menu.tenantId, snapshot.menu.locationId), snapshot);
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

  async softDelete(id, tenantId, locationId, deletedBy) {
    const found = await this.findById(id, tenantId, locationId);
    if (!found) return;
    found.archive(deletedBy || null);
    await this.update(found);
  }
}

class InMemoryKitchenStationRepository {
  constructor() {
    this.items = new Map();
  }

  key(id, tenantId, locationId) {
    return `${tenantId}:${locationId}:${id}`;
  }

  async save(station) {
    const value = station.toJSON();
    this.items.set(this.key(value.id, value.tenantId, value.locationId), value);
  }

  async update(station) {
    const value = station.toJSON();
    this.items.set(this.key(value.id, value.tenantId, value.locationId), value);
  }

  async findById(id, tenantId, locationId) {
    const value = this.items.get(this.key(id, tenantId, locationId));
    if (!value) return null;
    const { KitchenStationEntity } = require('../../apps/api/dist/modules/dining/domain/kitchen-station.entity');
    return KitchenStationEntity.fromPersistence(value);
  }

  async findAllByLocation(tenantId, locationId) {
    const prefix = `${tenantId}:${locationId}:`;
    const { KitchenStationEntity } = require('../../apps/api/dist/modules/dining/domain/kitchen-station.entity');
    return [...this.items.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([, value]) => KitchenStationEntity.fromPersistence(value));
  }

  async softDelete(id, tenantId, locationId) {
    const entity = await this.findById(id, tenantId, locationId);
    if (!entity) return;
    entity.archive('tester');
    await this.update(entity);
  }
}

class CapturingEventPublisher {
  constructor() {
    this.events = [];
  }

  async publish(event) {
    this.events.push(event);
  }
}

function seedMenuAggregate({ tenantId = 'tenant-1', locationId = 'loc-1', createdBy = 'seed-user' } = {}) {
  const menu = MenuAggregate.create({
    tenantId,
    locationId,
    name: 'Main Menu',
    description: 'Seed menu',
    createdBy,
  });

  const category = CategoryEntity.create({
    tenantId,
    locationId,
    menuId: menu.id,
    name: 'Starters',
    createdBy,
  });

  const item = ItemEntity.create({
    tenantId,
    locationId,
    categoryId: category.id,
    name: 'Soup',
    itemType: 'STANDARD',
    createdBy,
  });

  menu.addCategory(category);
  menu.addItem(item);

  return { menu, category: category.toJSON(), item: item.toJSON() };
}

module.exports = {
  InMemoryMenuRepository,
  InMemoryKitchenStationRepository,
  CapturingEventPublisher,
  seedMenuAggregate,
};
