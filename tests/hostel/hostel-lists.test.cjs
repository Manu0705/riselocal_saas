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

test('rooms page displays occupied bed counts, student identities, and vacancy status', () => {
  const roomsPage = read('apps/web/app/(dashboard)/dashboard/hostel/rooms/page.tsx');

  assert.match(roomsPage, /occupancy\?: number \| null/);
  assert.match(roomsPage, /vacancyStatus\?: string \| null/);
  assert.match(roomsPage, /bed\.status === 'OCCUPIED' && bed\.student/);
  assert.match(roomsPage, /\{occupied\} \/ \{capacity\}/);
  assert.match(roomsPage, /student\.admissionNumber/);
  assert.match(roomsPage, /room\.vacancyStatus === 'FULL'/);
  assert.match(roomsPage, /room\.vacancyStatus === 'PARTIALLY_OCCUPIED'/);
});

test('room detail page uses occupancy and bed-level occupants from the API', () => {
  const roomDetailsPage = read('apps/web/app/(dashboard)/dashboard/hostel/rooms/[id]/page.tsx');

  assert.match(roomDetailsPage, /vacancyStatus\?: string \| null/);
  assert.match(roomDetailsPage, /bed\.status === 'OCCUPIED' && bed\.student/);
  assert.match(roomDetailsPage, /room\.occupancy \?\?/);
  assert.match(roomDetailsPage, /room\.vacancyStatus === 'FULL'/);
  assert.match(roomDetailsPage, /room\.beds\.map\(\(bed\)/);
  assert.match(roomDetailsPage, /allocatedStudents\.map\(\(student\)/);
  assert.match(roomDetailsPage, /bed\.student\.admissionNumber/);
});
