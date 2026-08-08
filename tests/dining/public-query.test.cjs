const test = require('node:test');
const assert = require('node:assert/strict');

const { PublicMenuQueryService } = require('../../apps/api/dist/modules/dining/application/services/public-menu-query.service');
const { MenuAggregate } = require('../../apps/api/dist/modules/dining/domain/menu.aggregate');
const { InMemoryMenuRepository, seedMenuAggregate } = require('./fakes.cjs');

test('PublicMenuQueryService returns only active and available catalog view', async () => {
  const repo = new InMemoryMenuRepository();
  const service = new PublicMenuQueryService(repo);

  const seeded = seedMenuAggregate();
  await repo.save(seeded.menu);

  let result = await service.getActiveMenus({ tenantId: 'tenant-1', locationId: 'loc-1' });
  assert.equal(result.length, 1);
  assert.equal(result[0].categories.length, 1);
  assert.equal(result[0].categories[0].items.length, 1);

  const menu = await repo.findById(seeded.menu.id, 'tenant-1', 'loc-1');
  const snapshot = menu.toJSON();
  snapshot.items[0].availability = 'OUT_OF_STOCK';
  await repo.update(MenuAggregate.fromPersistence(snapshot));

  result = await service.getActiveMenus({ tenantId: 'tenant-1', locationId: 'loc-1' });
  assert.equal(result.length, 0);
});
