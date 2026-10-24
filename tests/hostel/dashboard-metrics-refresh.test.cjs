const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('successful admissions refresh the mounted hostel dashboard metrics', () => {
  const admissionFlow = read(
    'apps/web/app/(dashboard)/dashboard/hostel/components/hostel-admission-flow.tsx',
  );
  const dashboard = read('apps/web/app/(dashboard)/dashboard/hostel/HostelDashboard.tsx');

  assert.match(admissionFlow, /window\.dispatchEvent\(new Event\('hostel:admission-created'\)\)/);
  assert.match(dashboard, /window\.addEventListener\('hostel:admission-created', loadDashboardData\)/);
  assert.match(
    dashboard,
    /window\.removeEventListener\('hostel:admission-created', loadDashboardData\)/,
  );
});
