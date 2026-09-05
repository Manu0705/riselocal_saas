const test = require('node:test');
const assert = require('node:assert/strict');
const {
  HostelPropertyService,
} = require('../../apps/api/dist/modules/hostel/application/hostel-property.service');

class InMemoryHostelRepository {
  constructor() {
    this.hostels = [
      { id: 'hostel-1', tenantId: 'tenant-a', name: 'A Hostel' },
      { id: 'hostel-1', tenantId: 'tenant-b', name: 'B Hostel' },
    ];
    this.rooms = [
      { id: 'room-1', tenantId: 'tenant-a', hostelId: 'hostel-1', roomNumber: 'A-1' },
      { id: 'room-1', tenantId: 'tenant-b', hostelId: 'hostel-1', roomNumber: 'B-1' },
    ];
    this.students = [
      {
        id: 'student-1',
        tenantId: 'tenant-a',
        hostelId: 'hostel-1',
        name: 'A Student',
        userId: 'user-a',
      },
      {
        id: 'student-1',
        tenantId: 'tenant-b',
        hostelId: 'hostel-1',
        name: 'B Student',
        userId: 'user-b',
      },
    ];
    this.staff = [];
  }

  findHostels(tenantId) {
    return Promise.resolve(this.hostels.filter((entry) => entry.tenantId === tenantId));
  }

  createHostel(input) {
    const created = { id: `hostel-${this.hostels.length + 1}`, ...input };
    this.hostels.push(created);
    return Promise.resolve(created);
  }

  findRooms({ tenantId, hostelId }) {
    return Promise.resolve(
      this.rooms.filter((entry) => entry.tenantId === tenantId && entry.hostelId === hostelId),
    );
  }

  createRoom(input) {
    const created = { id: `room-${this.rooms.length + 1}`, ...input };
    this.rooms.push(created);
    return Promise.resolve(created);
  }

  listStudents({ tenantId, hostelId, userId, page, limit }) {
    const items = this.students.filter(
      (entry) =>
        entry.tenantId === tenantId &&
        (!hostelId || entry.hostelId === hostelId) &&
        (!userId || entry.userId === userId),
    );
    return Promise.resolve({
      items: items.slice((page - 1) * limit, page * limit),
      total: items.length,
    });
  }

  findStudent({ tenantId, id, userId }) {
    return Promise.resolve(
      this.students.find(
        (entry) =>
          entry.tenantId === tenantId && entry.id === id && (!userId || entry.userId === userId),
      ) || null,
    );
  }

  createStudent(input) {
    const created = { id: `student-${this.students.length + 1}`, ...input };
    this.students.push(created);
    return Promise.resolve(created);
  }

  updateStudent(input) {
    const index = this.students.findIndex(
      (entry) => entry.tenantId === input.tenantId && entry.id === input.id,
    );
    if (index < 0) return Promise.reject(new Error('Student not found'));
    this.students[index] = { ...this.students[index], ...input };
    return Promise.resolve(this.students[index]);
  }

  findStaff({ tenantId, hostelId }) {
    return Promise.resolve(
      this.staff.filter((entry) => entry.tenantId === tenantId && entry.hostelId === hostelId),
    );
  }

  createStaffAssignment(input) {
    const created = { id: `staff-${this.staff.length + 1}`, ...input };
    this.staff.push(created);
    return Promise.resolve(created);
  }
}

test('hostel reads never cross tenant boundaries', async () => {
  const service = new HostelPropertyService(new InMemoryHostelRepository());

  const tenantAHostels = await service.listHostels('tenant-a');
  const tenantARooms = await service.listRooms('tenant-a', 'hostel-1');
  const tenantAStudents = await service.listStudents('tenant-a', {
    hostelId: 'hostel-1',
    page: 1,
    limit: 25,
  });

  assert.deepEqual(
    tenantAHostels.map((entry) => entry.tenantId),
    ['tenant-a'],
  );
  assert.deepEqual(
    tenantARooms.map((entry) => entry.tenantId),
    ['tenant-a'],
  );
  assert.deepEqual(
    tenantAStudents.items.map((entry) => entry.tenantId),
    ['tenant-a'],
  );
});

test('hostel writes preserve the caller tenant identity', async () => {
  const repository = new InMemoryHostelRepository();
  const service = new HostelPropertyService(repository);

  await service.createRoom('tenant-b', {
    hostelId: 'hostel-1',
    roomNumber: 'B-2',
    capacity: 4,
  });
  await service.createStudent('tenant-b', {
    hostelId: 'hostel-1',
    admissionNumber: 'B-2',
    name: 'B Student 2',
  });
  await service.createStaff('tenant-b', {
    hostelId: 'hostel-1',
    userId: 'user-b',
    role: 'STAFF',
  });

  assert.equal(repository.rooms.at(-1).tenantId, 'tenant-b');
  assert.equal(repository.students.at(-1).tenantId, 'tenant-b');
  assert.equal(repository.staff.at(-1).tenantId, 'tenant-b');
});

test('hostel service rejects invalid cross-tenant context values', async () => {
  const service = new HostelPropertyService(new InMemoryHostelRepository());

  await assert.rejects(() => service.listRooms('', 'hostel-1'), /Tenant context is required/);
  await assert.rejects(
    () => service.createStudent('tenant-a', { hostelId: 'hostel-1', name: 'Student' }),
    /Admission number is required/,
  );
});

test('student visibility is restricted to the authenticated student account', async () => {
  const service = new HostelPropertyService(new InMemoryHostelRepository());

  const visible = await service.listStudents('tenant-a', {
    hostelId: 'hostel-1',
    userId: 'user-a',
    page: 1,
    limit: 25,
  });
  const hidden = await service.listStudents('tenant-a', {
    hostelId: 'hostel-1',
    userId: 'user-b',
    page: 1,
    limit: 25,
  });

  assert.deepEqual(
    visible.items.map((entry) => entry.name),
    ['A Student'],
  );
  assert.deepEqual(hidden.items, []);
});

test('concurrent allocations consume the final vacancy only once', async () => {
  const repository = {
    occupancy: 0,
    allocations: [],
    async allocateStudent(input) {
      if (this.occupancy >= 1) throw new Error('Room capacity is full');
      this.occupancy += 1;
      const allocation = { action: 'ALLOCATED', ...input };
      this.allocations.push(allocation);
      return allocation;
    },
  };
  const service = new HostelPropertyService(repository);

  const results = await Promise.allSettled([
    service.allocateStudent('tenant-a', {
      hostelId: 'hostel-1',
      roomId: 'room-1',
      studentId: 'student-a',
    }),
    service.allocateStudent('tenant-a', {
      hostelId: 'hostel-1',
      roomId: 'room-1',
      studentId: 'student-b',
    }),
  ]);

  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  assert.equal(repository.occupancy, 1);
  assert.match(
    results.find((result) => result.status === 'rejected').reason.message,
    /capacity is full/,
  );
});
