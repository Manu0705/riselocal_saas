const test = require('node:test');
const assert = require('node:assert/strict');

const { MenuService } = require('../../apps/api/dist/modules/dining/application/services/menu.service');
const { MenuItemService } = require('../../apps/api/dist/modules/dining/application/services/menu-item.service');
const { CategoryService } = require('../../apps/api/dist/modules/dining/application/services/category.service');
const { PricingService } = require('../../apps/api/dist/modules/dining/application/services/pricing.service');
const { AvailabilityService } = require('../../apps/api/dist/modules/dining/application/services/availability.service');
const {
  InMemoryMenuRepository,
  CapturingEventPublisher,
  seedMenuAggregate,
} = require('./fakes.cjs');

test('MenuService emits MenuCreated event', async () => {
  const repo = new InMemoryMenuRepository();
  const publisher = new CapturingEventPublisher();
  const service = new MenuService(repo, publisher);

  const created = await service.createMenu({
    tenantId: 't1',
    locationId: 'l1',
    name: 'Lunch',
    createdBy: 'u1',
  });

  assert.equal(created.menu.name, 'Lunch');
  assert.equal(publisher.events.length, 1);
  assert.equal(publisher.events[0].type, 'MenuCreated');
});

test('MenuItemService enforces variant rules and emits update event', async () => {
  const repo = new InMemoryMenuRepository();
  const publisher = new CapturingEventPublisher();
  const service = new MenuItemService(repo, publisher);

  const seeded = seedMenuAggregate();
  await repo.save(seeded.menu);

  await assert.rejects(
    () =>
      service.addVariant({
        menuId: seeded.menu.id,
        itemId: seeded.item.id,
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        name: 'Large',
        createdBy: 'u1',
      }),
    /VARIABLE|COMBO/i,
  );
});

test('AvailabilityService updates availability and emits canonical event', async () => {
  const repo = new InMemoryMenuRepository();
  const publisher = new CapturingEventPublisher();
  const service = new AvailabilityService(repo, publisher);

  const seeded = seedMenuAggregate();
  await repo.save(seeded.menu);

  await service.setAvailability({
    menuId: seeded.menu.id,
    itemId: seeded.item.id,
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    status: 'OUT_OF_STOCK',
    reason: 'Sold out',
    changedBy: 'u1',
  });

  const reloaded = await repo.findById(seeded.menu.id, 'tenant-1', 'loc-1');
  assert.ok(reloaded);
  const snapshot = reloaded.toJSON();
  const item = snapshot.items.find((entry) => entry.id === seeded.item.id);
  assert.equal(item.availability, 'OUT_OF_STOCK');
  assert.equal(publisher.events.at(-1).type, 'ItemAvailabilityChanged');
});

test('PricingService validates variant ownership and price contract', async () => {
  const repo = new InMemoryMenuRepository();
  const publisher = new CapturingEventPublisher();
  const service = new PricingService(repo, publisher);

  const seeded = seedMenuAggregate();
  await repo.save(seeded.menu);

  await assert.rejects(
    () =>
      service.upsertPrice({
        menuId: seeded.menu.id,
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        itemId: seeded.item.id,
        variantId: 'missing-variant',
        amount: 250,
        changedBy: 'u1',
      }),
    /Variant not found/i,
  );

  await service.upsertPrice({
    menuId: seeded.menu.id,
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    itemId: seeded.item.id,
    amount: 250,
    changedBy: 'u1',
  });

  assert.equal(publisher.events.at(-1).type, 'PriceChanged');
});

test('Category archive soft-deletes descendants for historical compatibility', async () => {
  const repo = new InMemoryMenuRepository();
  const publisher = new CapturingEventPublisher();
  const service = new CategoryService(repo, publisher);

  const seeded = seedMenuAggregate();
  await repo.save(seeded.menu);

  await service.archiveCategory({
    menuId: seeded.menu.id,
    categoryId: seeded.category.id,
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    archivedBy: 'u1',
  });

  const reloaded = await repo.findById(seeded.menu.id, 'tenant-1', 'loc-1');
  const snapshot = reloaded.toJSON();

  const category = snapshot.categories.find((entry) => entry.id === seeded.category.id);
  const item = snapshot.items.find((entry) => entry.id === seeded.item.id);

  assert.equal(category.status, 'ARCHIVED');
  assert.ok(category.deletedAt instanceof Date);
  assert.equal(item.status, 'ARCHIVED');
  assert.ok(item.deletedAt instanceof Date);
  assert.equal(item.id, seeded.item.id);
});
