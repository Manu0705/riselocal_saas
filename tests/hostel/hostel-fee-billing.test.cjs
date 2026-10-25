const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  getCurrentFeeBillingPeriod,
  getOneTimeFeePeriod,
} = require('../../apps/api/dist/modules/hostel/application/hostel-fee-billing');
const {
  HostelPropertyService,
} = require('../../apps/api/dist/modules/hostel/application/hostel-property.service');

const root = path.join(__dirname, '..', '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('monthly invoices are due on the fifth, or immediately when generated after it', () => {
  const period = getCurrentFeeBillingPeriod('MONTHLY', new Date('2026-10-03T09:00:00.000Z'));
  assert.equal(period.start.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(period.end.toISOString(), '2026-10-31T23:59:59.999Z');
  assert.equal(period.dueDate.toISOString(), '2026-10-05T00:00:00.000Z');

  const overdueStart = new Date('2026-10-24T09:00:00.000Z');
  const latePeriod = getCurrentFeeBillingPeriod('MONTHLY', overdueStart);
  assert.equal(latePeriod.dueDate, overdueStart);
});

test('recurring frequencies use calendar quarter, half-year, and year periods', () => {
  assert.equal(
    getCurrentFeeBillingPeriod(
      'QUARTERLY',
      new Date('2026-08-02T00:00:00.000Z'),
    ).start.toISOString(),
    '2026-07-01T00:00:00.000Z',
  );
  assert.equal(
    getCurrentFeeBillingPeriod(
      'HALF_YEARLY',
      new Date('2026-08-02T00:00:00.000Z'),
    ).start.toISOString(),
    '2026-07-01T00:00:00.000Z',
  );
  assert.equal(
    getCurrentFeeBillingPeriod('YEARLY', new Date('2026-08-02T00:00:00.000Z')).start.toISOString(),
    '2026-01-01T00:00:00.000Z',
  );
  assert.equal(getCurrentFeeBillingPeriod('ONE_TIME', new Date()), null);
});

test('one-time fee billing has a stable date and is not treated as recurring', () => {
  const createdAt = new Date('2026-10-08T12:00:00.000Z');
  const period = getOneTimeFeePeriod(createdAt, new Date('2026-10-24T09:00:00.000Z'));
  assert.equal(period.start.toISOString(), '2026-10-08T00:00:00.000Z');
  assert.equal(period.end, period.start);
  assert.equal(period.dueDate.toISOString(), '2026-10-24T09:00:00.000Z');
  assert.equal(getCurrentFeeBillingPeriod('ONE_TIME', createdAt), null);
});

test('fee API keeps fee category separate from billing frequency', async () => {
  let savedInput;
  const service = new HostelPropertyService({
    async createFee(input) {
      savedInput = input;
      return input;
    },
  });

  await service.createFee('tenant-a', {
    hostelId: 'hostel-a',
    name: 'Monthly rent',
    type: 'OTHER',
    billingFrequency: 'QUARTERLY',
    amount: 12000,
  });

  assert.equal(savedInput.type, 'OTHER');
  assert.equal(savedInput.billingFrequency, 'QUARTERLY');
});

test('fee creation and active admissions apply current property fees idempotently', () => {
  const repository = read(
    'apps/api/src/modules/hostel/infrastructure/hostel-property.prisma.repository.ts',
  );
  const schema = read('packages/database/prisma/schema.prisma');
  const migration = read(
    'packages/database/prisma/migrations/20261024100000_hostel_fee_billing/migration.sql',
  );
  const scheduler = read(
    'apps/api/src/modules/hostel/infrastructure/hostel-fee-billing.scheduler.ts',
  );

  assert.match(schema, /billingFrequency\s+HostelFeeFrequency/);
  assert.match(schema, /billingKey\s+String\?/);
  assert.match(repository, /billingKey,\s*status: 'ACTIVE'/);
  assert.match(repository, /async generateCurrentFeeInvoices/);
  assert.match(repository, /this\.applyActiveFeesToStudent\(/);
  assert.match(migration, /SET "isActive" = FALSE/);
  assert.match(migration, /"tenantId", "billingKey"/);
  assert.match(scheduler, /repository\.generateCurrentFeeInvoices\(\)/);
});
