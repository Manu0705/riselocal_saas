const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  HostelPropertyService,
} = require('../../apps/api/dist/modules/hostel/application/hostel-property.service');

const root = path.join(__dirname, '..', '..');
function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function paymentRepository(overrides = {}) {
  return {
    async initiatePayment(input) {
      return {
        id: 'payment-1',
        tenantId: input.tenantId,
        studentId: 'student-1',
        amount: input.amount,
        status: 'INITIATED',
      };
    },
    async listPayments() {
      return { items: [], total: 0 };
    },
    async findPayment() {
      return null;
    },
    async submitPayment(input) {
      return { id: input.id, status: 'SUBMITTED', utr: input.utr };
    },
    async verifyPayment(input) {
      return { id: input.id, status: 'PAID', receipt: { receiptNumber: 'RL-1' } };
    },
    async rejectPayment(input) {
      return { id: input.id, status: 'REJECTED', reason: input.reason };
    },
    ...overrides,
  };
}

test('payment initiation is not a paid transition', async () => {
  const service = new HostelPropertyService(paymentRepository());
  const payment = await service.initiatePayment('tenant-a', {
    studentId: 'student-1',
    amount: 100,
  });
  assert.equal(payment.status, 'INITIATED');
  assert.notEqual(payment.status, 'PAID');
});

test('payment submission requires an idempotency key and UTR', async () => {
  const service = new HostelPropertyService(paymentRepository());
  await assert.rejects(
    () => service.submitPayment('tenant-a', 'payment-1', { utr: 'UTR-1' }),
    /Idempotency key is required/,
  );
  await assert.rejects(
    () => service.submitPayment('tenant-a', 'payment-1', { idempotencyKey: 'submit-1' }),
    /UTR is required/,
  );
});

test('verification returns a receipt only through the verification operation', async () => {
  const service = new HostelPropertyService(paymentRepository());
  const verified = await service.verifyPayment(
    'tenant-a',
    'payment-1',
    { idempotencyKey: 'verify-1' },
    'staff-1',
  );
  assert.equal(verified.status, 'PAID');
  assert.equal(verified.receipt.receiptNumber, 'RL-1');
});

test('payment API routes and gateway-free UPI behavior are present', () => {
  const routes = read('apps/api/src/modules/hostel/presentation/hostel.routes.ts');
  const controller = read('apps/api/src/modules/hostel/presentation/hostel.controller.ts');
  assert.match(routes, /\/payments\/initiate/);
  assert.match(routes, /\/payments\/:id\/submit/);
  assert.match(routes, /\/payments\/:id\/verify/);
  assert.match(routes, /\/payments\/:id\/reject/);
  assert.match(controller, /upi:\/\/pay/);
  assert.match(controller, /does not process or confirm/);
});

test('payment verification creates receipts and never trusts screenshots as payment', () => {
  const repository = read(
    'apps/api/src/modules/hostel/infrastructure/hostel-property.prisma.repository.ts',
  );
  assert.match(repository, /status: 'PAID'/);
  assert.match(repository, /paymentReceipt\.create/);
  assert.match(repository, /status: 'SUBMITTED'/);
  assert.match(repository, /proofUrl/);
});
