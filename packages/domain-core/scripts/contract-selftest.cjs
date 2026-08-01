#!/usr/bin/env node
/**
 * Contract regression tests for shared domain-core contracts.
 * Run: node packages/domain-core/scripts/contract-selftest.cjs
 * (requires domain-core build first)
 */
const assert = require('node:assert/strict');

const {
  normalizeLeadStatus,
  leadStatusToUiLabel,
  uiLabelToLeadStatus,
  canTransitionLeadStatus,
  LEAD_STATUSES,
} = require('../dist/lead.contract.js');

const {
  normalizeActionButtons,
  normalizeHour,
  normalizeAvailableHours,
  resolveThemeInput,
} = require('../dist/tenant.contract.js');

const { normalizeAuthRole, isAdminRole, normalizeTenantUserRole } = require('../dist/auth.contract.js');
const { apiError, apiSuccess } = require('../dist/api-response.contract.js');

assert.deepEqual([...LEAD_STATUSES], ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED']);

assert.equal(normalizeLeadStatus('Open'), 'NEW');
assert.equal(normalizeLeadStatus('Follow-Up'), 'QUALIFIED');
assert.equal(normalizeLeadStatus('LOST'), 'CLOSED');
assert.equal(normalizeLeadStatus('WON'), 'CONVERTED');
assert.equal(normalizeLeadStatus('converted'), 'CONVERTED');
assert.equal(normalizeLeadStatus('nope'), 'NEW');

assert.equal(leadStatusToUiLabel('QUALIFIED'), 'Follow-Up');
assert.equal(uiLabelToLeadStatus('Lost'), 'CLOSED');
assert.equal(canTransitionLeadStatus('NEW', 'CONTACTED'), true);
assert.equal(canTransitionLeadStatus('CONVERTED', 'NEW'), false);

assert.equal(resolveThemeInput({ themeKey: 'theme-modern' }), 'modern');
assert.equal(normalizeHour(9), 9);
assert.equal(normalizeHour(25), undefined);
assert.deepEqual(normalizeAvailableHours([9, '10', 99]), [9, 10]);

const buttons = normalizeActionButtons({
  chatWhatsApp: { enabled: true, message: 'Hi', phone: '123' },
  call: { enabled: false, label: 'Ring' },
});
assert.equal(buttons.chatWhatsApp.message, 'Hi');
assert.equal(buttons.chatWhatsApp.phone, '123');
assert.equal(buttons.call.label, 'Ring');
assert.equal(buttons.confirmBooking?.enabled, true);

assert.equal(normalizeAuthRole('ADMIN'), 'admin');
assert.equal(isAdminRole('super_admin'), true);
assert.equal(normalizeTenantUserRole('Manager'), 'manager');

const ok = apiSuccess({ id: 1 }, 'req-1');
assert.equal(ok.success, true);
assert.equal(ok.requestId, 'req-1');
const err = apiError('boom', { code: 'X' });
assert.equal(err.success, false);
assert.equal(err.message, 'boom');
assert.equal(err.code, 'X');

console.log('PASS: domain-core contract selftest');
