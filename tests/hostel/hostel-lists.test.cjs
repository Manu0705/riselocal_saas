const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('fees page renders the API array response as well as paginated responses', () => {
  const feesPage = read('apps/web/app/(dashboard)/dashboard/hostel/fees/page.tsx');

  assert.match(feesPage, /ApiResponse<Fee\[\] \| PaginatedFeeListResponse>/);
  assert.match(feesPage, /if \(Array\.isArray\(response\.data\)\)/);
  assert.match(feesPage, /response\.data\.slice\(\(page - 1\) \* PAGE_LIMIT, page \* PAGE_LIMIT\)/);
  assert.match(feesPage, /type: form\.type/);
  assert.match(feesPage, /billingFrequency: form\.frequency/);
  assert.match(feesPage, /fee\.billingFrequency \?\? fee\.frequency/);
  assert.match(feesPage, /<span>Fee category<\/span>/);
});

test('rooms page lets users select the property whose rooms should be listed', () => {
  const roomsPage = read('apps/web/app/(dashboard)/dashboard/hostel/rooms/page.tsx');

  assert.match(roomsPage, /selectedHostelId/);
  assert.match(roomsPage, /Filter rooms by hostel property/);
  assert.match(roomsPage, /properties\.map\(\(property\)/);
  assert.match(roomsPage, /hostelId=\$\{encodeURIComponent\(\s*selectedHostelId/);
});
