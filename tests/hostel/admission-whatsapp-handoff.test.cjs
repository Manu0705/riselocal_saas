const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const flowPath = path.join(
  __dirname,
  '..',
  '..',
  'apps',
  'web',
  'app',
  '(dashboard)',
  'dashboard',
  'hostel',
  'components',
  'hostel-admission-flow.tsx',
);

test('existing admissions can share their details without re-exposing the passkey', () => {
  const flow = fs.readFileSync(flowPath, 'utf8');

  assert.match(flow, /if \(!createdStudent\) return;/);
  assert.match(flow, /`Admission Number: \$\{createdStudent\.admissionNumber\}`/);
  assert.match(flow, /`Student Name: \$\{createdStudent\.name\}`/);
  assert.match(flow, /`Admission Date: \$\{dateText\}`/);
  assert.match(flow, /\.\.\.\(temporaryPasskey \? \[`Temporary Passkey:/);
  assert.match(flow, /admittingExistingStudent \? \(/);
  assert.match(flow, /cannot be retrieved or\s+shared again/);
  assert.match(flow, /onClick=\{\(\) => openWhatsApp\('student'\)\}/);
  assert.match(flow, /onClick=\{\(\) => openWhatsApp\('admin'\)\}/);
  assert.match(flow, />\s*Share with Student\s*</);
  assert.match(flow, />\s*Forward to Admin\s*</);
});

test('copying a passkey gives visible success or failure feedback', () => {
  const flow = fs.readFileSync(flowPath, 'utf8');

  assert.match(flow, /await navigator\.clipboard\.writeText\(temporaryPasskey\)/);
  assert.match(flow, /setPasskeyCopied\(true\)/);
  assert.match(flow, /\{passkeyCopied \? 'Copied!' : 'Copy'\}/);
  assert.match(flow, /Could not copy the passkey/);
});

test('student WhatsApp delivery uses the same phone number captured for admission', () => {
  const flow = fs.readFileSync(flowPath, 'utf8');

  assert.match(flow, /normalizeWhatsAppNumber\(phone\)/);
  assert.match(flow, /recipient === 'student' \? phone : adminWhatsApp/);
  assert.match(flow, /student WhatsApp message will be sent to the phone number in Student/);
  assert.match(flow, /Student WhatsApp Number \(include country code\)/);
  assert.doesNotMatch(flow, /studentWhatsApp/);
});

test('admission advisory locks return a supported scalar instead of PostgreSQL void', () => {
  const repositoryPath = path.join(
    __dirname,
    '..',
    '..',
    'apps',
    'api',
    'src',
    'modules',
    'hostel',
    'infrastructure',
    'hostel-property.prisma.repository.ts',
  );
  const repository = fs.readFileSync(repositoryPath, 'utf8');

  assert.match(repository, /private async acquireAdvisoryTransactionLock/);
  assert.match(repository, /SELECT 1::int AS locked\s+FROM advisory_lock/);
  assert.doesNotMatch(repository, /\$queryRaw<Array<\{ pg_advisory_xact_lock: null \}>>/);
});
