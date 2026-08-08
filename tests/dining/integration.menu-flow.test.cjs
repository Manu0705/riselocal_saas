const test = require('node:test');
const assert = require('node:assert/strict');

const { MenuService } = require('../../apps/api/dist/modules/dining/application/services/menu.service');
const { CategoryService } = require('../../apps/api/dist/modules/dining/application/services/category.service');
const { MenuItemService } = require('../../apps/api/dist/modules/dining/application/services/menu-item.service');
const { AvailabilityService } = require('../../apps/api/dist/modules/dining/application/services/availability.service');
const { PricingService } = require('../../apps/api/dist/modules/dining/application/services/pricing.service');
const {
  InMemoryMenuRepository,
  CapturingEventPublisher,
} = require('./fakes.cjs');

test('Integration flow: create menu -> category -> item -> pricing -> availability -> archive preserves historical IDs', async () => {
  const repo = new InMemoryMenuRepository();
  const publisher = new CapturingEventPublisher();

  const menuService = new MenuService(repo, publisher);
  const categoryService = new CategoryService(repo, publisher);
  const itemService = new MenuItemService(repo, publisher);
  const pricingService = new PricingService(repo, publisher);
  const availabilityService = new AvailabilityService(repo, publisher);

  const createdMenu = await menuService.createMenu({
    tenantId: 'tenant-100',
    locationId: 'location-200',
    name: 'Production Menu',
    createdBy: 'owner-1',
  });

  const category = await categoryService.createCategory({
    menuId: createdMenu.menu.id,
    tenantId: 'tenant-100',
    locationId: 'location-200',
    name: 'Mains',
    createdBy: 'owner-1',
  });

  const item = await itemService.createItem({
    menuId: createdMenu.menu.id,
    categoryId: category.id,
    tenantId: 'tenant-100',
    locationId: 'location-200',
    name: 'Paneer Bowl',
    basePrice: 320,
    itemType: 'STANDARD',
    createdBy: 'owner-1',
  });

  await pricingService.upsertPrice({
    menuId: createdMenu.menu.id,
    tenantId: 'tenant-100',
    locationId: 'location-200',
    itemId: item.id,
    amount: 349,
    changedBy: 'owner-1',
  });

  await availabilityService.setAvailability({
    menuId: createdMenu.menu.id,
    itemId: item.id,
    tenantId: 'tenant-100',
    locationId: 'location-200',
    status: 'OUT_OF_STOCK',
    reason: 'End of service',
    changedBy: 'owner-1',
  });

  await itemService.archiveItem({
    menuId: createdMenu.menu.id,
    itemId: item.id,
    tenantId: 'tenant-100',
    locationId: 'location-200',
    archivedBy: 'owner-1',
  });

  const isolatedNull = await repo.findById(createdMenu.menu.id, 'tenant-100', 'other-location');
  assert.equal(isolatedNull, null);

  const reloaded = await repo.findById(createdMenu.menu.id, 'tenant-100', 'location-200');
  assert.ok(reloaded);

  const snapshot = reloaded.toJSON();
  const archivedItem = snapshot.items.find((entry) => entry.id === item.id);
  assert.ok(archivedItem);
  assert.equal(archivedItem.status, 'ARCHIVED');
  assert.ok(archivedItem.deletedAt instanceof Date);

  // Historical compatibility: archived records retain stable primary IDs.
  assert.equal(archivedItem.id, item.id);

  const priceRecord = snapshot.prices.find((entry) => entry.itemId === item.id);
  assert.ok(priceRecord);
  assert.ok(priceRecord.deletedAt instanceof Date);

  const eventTypes = publisher.events.map((event) => event.type);
  assert.ok(eventTypes.includes('MenuCreated'));
  assert.ok(eventTypes.includes('PriceChanged'));
  assert.ok(eventTypes.includes('ItemAvailabilityChanged'));
  assert.ok(eventTypes.includes('ItemArchived'));
});
