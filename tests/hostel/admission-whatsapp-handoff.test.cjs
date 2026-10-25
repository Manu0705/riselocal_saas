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
