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
  assert.match(routes, /\/hostel\/rooms\/reserve/);
  assert.match(routes, /\/hostel\/rooms\/allocate/);
  assert.match(routes, /\/hostel\/rooms\/deallocate/);
  assert.match(routes, /\/hostel\/rooms\/auto-assign/);
  assert.match(routes, /\/hostel\/rooms\/:id\/history/);
  assert.match(routes, /router\.delete\(/);
});

test('repeating a completed allocation for the same student and bed is idempotent', () => {
  const repository = read(
    'apps/api/src/modules/hostel/infrastructure/hostel-property.prisma.repository.ts',
  );
  const repositoryClass = repository.indexOf('export class HostelPropertyPrismaRepository');
  const allocationMethod = repository.slice(
    repository.indexOf('  allocateStudent(input: {', repositoryClass),
    repository.indexOf('  deallocateStudent(input: {', repositoryClass),
  );

  assert.match(allocationMethod, /student\.roomId === input\.roomId/);
  assert.match(allocationMethod, /activeStay\.bedId === input\.bedId/);
  assert.match(allocationMethod, /bed\.status === 'OCCUPIED'/);
  assert.match(allocationMethod, /bed\.studentId === input\.studentId/);
  assert.match(allocationMethod, /if \(allocation\) return \{ allocation, stay: activeStay \}/);
});

test('hostel enquiry routes expose tenant-authenticated list, create, and conversion operations', () => {
  const routes = read('apps/api/src/modules/hostel/presentation/hostel.routes.ts');

  assert.match(routes, /router\.get\(\s*'\/hostel\/enquiries'/);
  assert.match(routes, /router\.post\(\s*'\/hostel\/enquiries'/);
  assert.match(routes, /\/hostel\/enquiries\/:id\/convert/);
  assert.match(routes, /controller\.convertHostelEnquiry\.bind\(controller\)/);
});

test('hostel stays route exposes explicit stay history', () => {
  const routes = read('apps/api/src/modules/hostel/presentation/hostel.routes.ts');
  assert.match(routes, /router\.get\(\s*'\/hostel\/stays'/);
  assert.match(routes, /roleGuard\('owner', 'manager', 'staff', 'admin', 'super_admin'\)/);
  assert.match(routes, /controller\.listStays\.bind\(controller\)/);
});
