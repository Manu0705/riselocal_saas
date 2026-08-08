const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function listFiles(dir) {
  const output = [];
  const walk = (current) => {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else {
        output.push(abs);
      }
    }
  };
  walk(path.join(root, dir));
  return output;
}

test('No duplicate canonical Dining enums/types are declared outside packages/domain-core/dining', () => {
  const forbiddenTokens = [
    'export type MenuStatus',
    'export type MenuItemType',
    'export type AvailabilityStatus',
    'export type ModifierType',
    'export type KitchenStationStatus',
    'export type TableStatus',
    'export type CartStatus',
    'export type OrderRoundStatus',
  ];

  const files = listFiles('apps').concat(listFiles('packages'));
  const offenders = [];

  for (const abs of files) {
    const rel = path.relative(root, abs).replace(/\\/g, '/');
    if (!rel.endsWith('.ts')) continue;
    if (rel.includes('/dist/')) continue;
    if (rel.startsWith('packages/domain-core/dining/')) continue;

    const content = fs.readFileSync(abs, 'utf8');
    for (const token of forbiddenTokens) {
      if (content.includes(token)) {
        offenders.push(`${rel} -> ${token}`);
      }
    }
  }

  assert.deepEqual(offenders, []);
});

test('Menu repository methods include tenant/location isolation guards', () => {
  const content = read('apps/api/src/modules/dining/infrastructure/repositories/prisma-menu.repository.ts');

  assert.match(content, /findById\([\s\S]*tenantId[\s\S]*locationId/);
  assert.match(content, /findAllByLocation\([\s\S]*tenantId[\s\S]*locationId/);
  assert.match(content, /softDelete\([\s\S]*tenantId[\s\S]*locationId/);
  assert.match(content, /where:\s*\{[\s\S]*tenantId,[\s\S]*locationId/);
});

test('Routes wire protected Dining endpoints after auth middleware in global router', () => {
  const content = read('apps/api/src/routes.ts');
  const authIndex = content.indexOf('router.use(authMiddleware);');
  const protectedDiningIndex = content.indexOf('router.use(diningRoutes);');
  const publicDiningIndex = content.indexOf('router.use(diningPublicRoutes);');

  assert.ok(authIndex > -1);
  assert.ok(protectedDiningIndex > authIndex);
  assert.ok(publicDiningIndex > -1 && publicDiningIndex < authIndex);
});

test('Permission contract constants are unique and consistently namespaced', () => {
  const permissions = require('../../packages/domain-core/dist/dining/menu.permissions');
  const values = Object.values(permissions);

  assert.ok(values.length > 0);
  const unique = new Set(values);
  assert.equal(unique.size, values.length);

  for (const value of values) {
    assert.match(String(value), /^dining\./);
  }
});

test('Table permission constants are unique and consistently namespaced', () => {
  const permissions = require('../../packages/domain-core/dist/dining/table.permissions');
  const values = Object.values(permissions);

  assert.ok(values.length > 0);
  const unique = new Set(values);
  assert.equal(unique.size, values.length);

  for (const value of values) {
    assert.match(String(value), /^dining\./);
  }
});

test('Cart permission constants are unique and consistently namespaced', () => {
  const permissions = require('../../packages/domain-core/dist/dining/cart.permissions');
  const values = Object.values(permissions);

  assert.ok(values.length > 0);
  const unique = new Set(values);
  assert.equal(unique.size, values.length);

  for (const value of values) {
    assert.match(String(value), /^dining\./);
  }
});

test('Order round permission constants are unique and consistently namespaced', () => {
  const permissions = require('../../packages/domain-core/dist/dining/order-round.permissions');
  const values = Object.values(permissions);

  assert.ok(values.length > 0);
  const unique = new Set(values);
  assert.equal(unique.size, values.length);

  for (const value of values) {
    assert.match(String(value), /^dining\./);
  }
});

test('Waiter-assisted permission constants are unique and consistently namespaced', () => {
  const permissions = require('../../packages/domain-core/dist/dining/waiter-assist.permissions');
  const values = Object.entries(permissions)
    .filter(([, value]) => typeof value === 'string')
    .map(([, value]) => value);

  assert.ok(values.length > 0);
  const unique = new Set(values);
  assert.equal(unique.size, values.length);

  for (const value of values) {
    assert.match(String(value), /^dining\./);
  }
});

test('Order lock permission constants are unique and consistently namespaced', () => {
  const permissions = require('../../packages/domain-core/dist/dining/order-lock.permissions');
  const values = Object.values(permissions);

  assert.ok(values.length > 0);
  const unique = new Set(values);
  assert.equal(unique.size, values.length);

  for (const value of values) {
    assert.match(String(value), /^dining\./);
  }
});

test('Order modification permission constants are unique and consistently namespaced', () => {
  const permissions = require('../../packages/domain-core/dist/dining/order-modification.permissions');
  const values = Object.values(permissions);

  assert.ok(values.length > 0);
  const unique = new Set(values);
  assert.equal(unique.size, values.length);

  for (const value of values) {
    assert.match(String(value), /^dining\./);
  }
});

test('Table transfer permission constants are unique and consistently namespaced', () => {
  const permissions = require('../../packages/domain-core/dist/dining/table-transfer.permissions');
  const values = Object.values(permissions);

  assert.ok(values.length > 0);
  const unique = new Set(values);
  assert.equal(unique.size, values.length);

  for (const value of values) {
    assert.match(String(value), /^dining\./);
  }
});

test('Table group permission constants are unique and consistently namespaced', () => {
  const permissions = require('../../packages/domain-core/dist/dining/table-group.permissions');
  const values = Object.values(permissions).flatMap((value) => (typeof value === 'object' && value !== null ? Object.values(value) : [value]));

  assert.ok(values.length > 0);
  const unique = new Set(values);
  assert.equal(unique.size, values.length);

  for (const value of values) {
    assert.match(String(value), /^dining\./);
  }
});

test('Application event union aligns with canonical event contract names', () => {
  const eventContract = read('apps/api/src/modules/dining/application/contracts/domain-event.publisher.ts');
  const required = [
    "type: 'MenuCreated'",
    "type: 'MenuUpdated'",
    "type: 'ItemAvailabilityChanged'",
    "type: 'PriceChanged'",
    "type: 'ItemArchived'",
    "type: 'KitchenStationAssigned'",
    "type: 'OrderRoundCreated'",
    "type: 'OrderRoundSubmitted'",
    "type: 'OrderCreated'",
    "type: 'OrderRoundCancelled'",
    "type: 'WaiterJoinedSession'",
    "type: 'ParticipantLeftSession'",
    "type: 'AssistedItemAdded'",
    "type: 'OrderSubmittedByStaff'",
    "type: 'SessionOwnershipTransferred'",
    "type: 'OrderLockRequested'",
    "type: 'OrderLocked'",
    "type: 'OrderReopened'",
    "type: 'OrderLockFailed'",
    "type: 'OrderModificationRequested'",
    "type: 'OrderModificationApproved'",
    "type: 'OrderModificationRejected'",
    "type: 'OrderItemCancelled'",
    "type: 'OrderModified'",
    "type: 'TableTransferRequested'",
    "type: 'TableTransferApproved'",
    "type: 'SessionTableChanged'",
    "type: 'OldTableReleased'",
    "type: 'NewTableOccupied'",
    "type: 'TableTransferCompleted'",
    "type: 'TableTransferRejected'",
    "type: 'TableMergeRequested'",
    "type: 'TableMergeApproved'",
    "type: 'TableGroupCreated'",
    "type: 'TablesMerged'",
    "type: 'TableGroupReleased'",
    "type: 'TableStatusChanged'",
    "type: 'TableOccupied'",
  ];

  for (const token of required) {
    assert.ok(eventContract.includes(token), `Missing event union token ${token}`);
  }
});
