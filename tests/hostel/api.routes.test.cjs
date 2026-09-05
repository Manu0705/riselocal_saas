const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('hostel student routes expose CRUD and tenant-safe query entrypoints', () => {
  const routes = read('apps/api/src/modules/hostel/presentation/hostel.routes.ts');

  assert.match(routes, /router\.get\('\/hostel\/students'/);
  assert.match(routes, /router\.post\(\s*'\/hostel\/students'/);
  assert.match(routes, /router\.get\('\/hostel\/students\/:id'/);
  assert.match(routes, /router\.patch\(\s*'\/hostel\/students\/:id'/);
  assert.match(routes, /roleGuard\('owner', 'manager', 'staff', 'admin', 'super_admin'\)/);
});

test('student role is part of the existing authentication contract', () => {
  const auth = read('packages/domain-core/auth.contract.ts');
  assert.match(auth, /AUTH_ROLES = \[[^\]]*'student'/);
  assert.match(auth, /TENANT_USER_ROLES = \[[^\]]*'student'/);
});

test('room routes expose vacancy and allocation operations', () => {
  const routes = read('apps/api/src/modules/hostel/presentation/hostel.routes.ts');

  assert.match(routes, /\/hostel\/rooms\/vacancies/);
  assert.match(routes, /\/hostel\/rooms\/vacancy-summary/);
  assert.match(routes, /\/hostel\/rooms\/allocate/);
  assert.match(routes, /\/hostel\/rooms\/deallocate/);
  assert.match(routes, /\/hostel\/rooms\/auto-assign/);
  assert.match(routes, /\/hostel\/rooms\/:id\/history/);
  assert.match(routes, /router\.delete\(/);
});
