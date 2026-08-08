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
const {
  normalizeSessionParticipantRole,
  normalizeSessionParticipantStatus,
  normalizeSessionTokenStatus,
  isValidSessionToken,
  isValidDeviceId,
} = require('../dist/dining/session.validation.js');
const {
  resolveSessionParticipantPermissions,
  DINING_SESSION_PARTICIPANT_PERMISSION_REMOVE,
  DINING_SESSION_TRANSFER_OWNERSHIP_PERMISSION,
} = require('../dist/dining/waiter-assist.permissions.js');
const {
  normalizeOrderRoundStatus,
  normalizeOrderStatus,
  normalizeKitchenItemStatus,
  canTransitionOrderRoundStatus,
} = require('../dist/dining/order-round.validation.js');
const {
  normalizeOrderLockStatus,
  normalizeOrderItemLockStatus,
  canTransitionOrderLockStatus,
  canTransitionOrderItemLockStatus,
} = require('../dist/dining/order-lock.validation.js');
const {
  normalizeModificationStatus,
  normalizeAdjustmentType,
  canTransitionModificationStatus,
} = require('../dist/dining/order-modification.validation.js');
const {
  normalizeTableTransferStatus,
  normalizeTableAssignmentStatus,
  canTransitionTableTransferStatus,
} = require('../dist/dining/table-transfer.validation.js');
const {
  normalizeTableMergeStatus,
  normalizeTableGroupStatus,
  canTransitionTableMergeStatus,
} = require('../dist/dining/table-group.validation.js');

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

assert.equal(normalizeSessionParticipantRole('waiter'), 'WAITER');
assert.equal(normalizeSessionParticipantStatus('disconnected'), 'DISCONNECTED');
assert.equal(normalizeSessionParticipantStatus('removed'), 'REMOVED');
assert.equal(normalizeSessionTokenStatus('active'), 'ACTIVE');
assert.equal(isValidSessionToken('S9F2-KM8A-Q7P4'), true);
assert.equal(isValidSessionToken('bad token'), false);
assert.equal(isValidDeviceId('device-12345'), true);
assert.equal(isValidDeviceId('a'), false);

const waiterPermissions = resolveSessionParticipantPermissions('WAITER');
const managerPermissions = resolveSessionParticipantPermissions('MANAGER');
assert.equal(waiterPermissions.length > 0, true);
assert.equal(managerPermissions.includes(DINING_SESSION_PARTICIPANT_PERMISSION_REMOVE), true);
assert.equal(managerPermissions.includes(DINING_SESSION_TRANSFER_OWNERSHIP_PERMISSION), true);

assert.equal(normalizeOrderRoundStatus('processing'), 'PROCESSING');
assert.equal(normalizeOrderStatus('completed'), 'COMPLETED');
assert.equal(normalizeKitchenItemStatus('ready'), 'READY');
assert.equal(canTransitionOrderRoundStatus('DRAFT', 'SUBMITTED'), true);
assert.equal(canTransitionOrderRoundStatus('COMPLETED', 'DRAFT'), false);

assert.equal(normalizeOrderLockStatus('lock requested'), 'LOCK_REQUESTED');
assert.equal(normalizeOrderItemLockStatus('processing'), 'PROCESSING');
assert.equal(canTransitionOrderLockStatus('UNLOCKED', 'LOCKED'), true);
assert.equal(canTransitionOrderItemLockStatus('LOCKED', 'DRAFT'), false);

assert.equal(normalizeModificationStatus('approved'), 'APPROVED');
assert.equal(normalizeAdjustmentType('quantity-change'), 'QUANTITY_CHANGE');
assert.equal(canTransitionModificationStatus('REQUESTED', 'APPROVED'), true);
assert.equal(canTransitionModificationStatus('REJECTED', 'APPROVED'), false);

assert.equal(normalizeTableTransferStatus('rejected'), 'REJECTED');
assert.equal(normalizeTableAssignmentStatus('released'), 'RELEASED');
assert.equal(canTransitionTableTransferStatus('REQUESTED', 'APPROVED'), true);
assert.equal(canTransitionTableTransferStatus('COMPLETED', 'REQUESTED'), false);
assert.equal(normalizeTableMergeStatus('approved'), 'APPROVED');
assert.equal(normalizeTableGroupStatus('released'), 'RELEASED');
assert.equal(canTransitionTableMergeStatus('REQUESTED', 'APPROVED'), true);
assert.equal(canTransitionTableMergeStatus('APPROVED', 'COMPLETED'), true);
assert.equal(canTransitionTableMergeStatus('COMPLETED', 'REQUESTED'), false);

console.log('PASS: domain-core contract selftest');
