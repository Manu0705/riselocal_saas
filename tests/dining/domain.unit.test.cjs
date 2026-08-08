const test = require('node:test');
const assert = require('node:assert/strict');

const { ItemEntity } = require('../../apps/api/dist/modules/dining/domain/item.entity');
const { PricingEntity } = require('../../apps/api/dist/modules/dining/domain/pricing.entity');
const { AvailabilityEntity } = require('../../apps/api/dist/modules/dining/domain/availability.entity');
const { ModifierEntity } = require('../../apps/api/dist/modules/dining/domain/modifier.entity');

test('ItemEntity rejects negative base price', () => {
  assert.throws(
    () => ItemEntity.create({ tenantId: 't1', locationId: 'l1', categoryId: 'c1', name: 'Burger', basePrice: -1 }),
    /non-negative/i,
  );
});

test('PricingEntity enforces effective date range', () => {
  assert.throws(
    () =>
      PricingEntity.create({
        tenantId: 't1',
        locationId: 'l1',
        itemId: 'i1',
        amount: 100,
        effectiveFrom: new Date('2026-10-01T00:00:00.000Z'),
        effectiveTo: new Date('2026-09-01T00:00:00.000Z'),
      }),
    /effectiveFrom/i,
  );
});

test('AvailabilityEntity blocks invalid transition', () => {
  const availability = AvailabilityEntity.create({
    tenantId: 't1',
    locationId: 'l1',
    itemId: 'i1',
    status: 'AVAILABLE',
    updatedBy: 'u1',
  });

  availability.transitionTo('OUT_OF_STOCK', 'no stock', 'u2');
  assert.throws(
    () => availability.transitionTo('TEMPORARILY_UNAVAILABLE', 'still down', 'u3'),
    /Invalid availability transition/i,
  );

  assert.equal(availability.toJSON().status, 'OUT_OF_STOCK');
});

test('ModifierEntity validates modifier type', () => {
  assert.throws(
    () => ModifierEntity.create({ tenantId: 't1', locationId: 'l1', itemId: 'i1', name: 'Heat', type: 'INVALID' }),
    /Invalid modifier type/i,
  );
});
