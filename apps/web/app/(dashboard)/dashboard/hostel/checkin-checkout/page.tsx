'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api-client';

type Student = {
  id: string;
  name?: string;
  admissionNumber?: string;
};

type Room = {
  id: string;
  roomNumber?: string;
  name?: string;
  capacity?: number;
  occupied?: number;
  occupancy?: number;
  status?: string;
  hostelId?: string;
  hostel?: {
    id?: string;
    name?: string;
  };
};

type Allocation = {
  id?: string;
  studentId?: string;
  roomId?: string;
  status?: string;
  checkInDate?: string;
  checkOutDate?: string;
  allocatedAt?: string;
  createdAt?: string;
  student?: Student;
  room?: Room;
};

type ApiResponse = {
  items?: unknown[];
  data?: unknown[];
  total?: number;
};

function getItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === 'object') {
    const value = response as ApiResponse;

    if (Array.isArray(value.items)) {
      return value.items;
    }

    if (Array.isArray(value.data)) {
      return value.data;
    }
  }

  return [];
}

function formatDate(value?: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStudentName(student?: Student) {
  if (!student) return 'Unknown student';

  return (
    student.name ||
    student.admissionNumber ||
    'Unnamed student'
  );
}

function getRoomName(room?: Room) {
  if (!room) return 'Unknown room';

  return room.roomNumber || room.name || room.id;
}

export default function HostelCheckinCheckoutPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  const [studentId, setStudentId] = useState('');
  const [roomId, setRoomId] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>(
    'active',
  );

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [studentsResponse, propertiesResponse] = await Promise.all([
        api.get('/hostel/students?page=1&limit=100'),
        api.get('/hostel/properties'),
      ]);

      const properties = getItems(propertiesResponse) as Array<{
        id?: string;
      }>;

      const hostelId = properties[0]?.id;

      if (!hostelId) {
        throw new Error('No hostel property found for this tenant.');
      }

      const roomsResponse = await api.get(
        `/hostel/rooms?page=1&limit=100&hostelId=${encodeURIComponent(hostelId)}`,
      );

      const studentItems = getItems(studentsResponse);
      const roomItems = getItems(roomsResponse);

      const nextStudents = studentItems as Student[];
      const nextRooms = roomItems as Room[];

      setStudents(nextStudents);
      setRooms(nextRooms);

      /*
      * The existing rooms API is the source of current allocations.
      * Some versions of the backend return allocations directly on rooms.
      */
      const nextAllocations: Allocation[] = [];

      nextRooms.forEach((room) => {
        const roomWithAllocations = room as Room & {
          allocations?: Allocation[];
          students?: Student[];
        };

        if (Array.isArray(roomWithAllocations.allocations)) {
          roomWithAllocations.allocations.forEach((allocation) => {
            nextAllocations.push({
              ...allocation,
              room: allocation.room || room,
            });
          });
        }

        if (
          Array.isArray(roomWithAllocations.students) &&
          roomWithAllocations.students.length > 0
        ) {
          roomWithAllocations.students.forEach((student) => {
            nextAllocations.push({
              studentId: student.id,
              roomId: room.id,
              student,
              room,
              status: 'ACTIVE',
            });
          });
        }
      });

      setAllocations(nextAllocations);
    } catch (err) {
      console.error('Failed to load check-in/check-out data:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load hostel check-in/check-out data.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const activeAllocations = useMemo(
    () =>
      allocations.filter((allocation) => {
        const status = String(allocation.status || '').toUpperCase();

        return (
          status === 'ACTIVE' ||
          status === 'ALLOCATED' ||
          status === 'CHECKED_IN' ||
          !status
        );
      }),
    [allocations],
  );

  const filteredAllocations = useMemo(() => {
    const source =
      activeTab === 'active' ? activeAllocations : allocations;

    const query = search.trim().toLowerCase();

    if (!query) {
      return source;
    }

    return source.filter((allocation) => {
      const studentName = getStudentName(
        allocation.student,
      ).toLowerCase();

      const admissionNumber = String(
        allocation.student?.admissionNumber || '',
      ).toLowerCase();

      const roomName = getRoomName(
        allocation.room,
      ).toLowerCase();

      return (
        studentName.includes(query) ||
        admissionNumber.includes(query) ||
        roomName.includes(query)
      );
    });
  }, [activeAllocations, allocations, activeTab, search]);

  const availableRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const status = String(room.status || '').toUpperCase();

        if (
          status === 'INACTIVE' ||
          status === 'MAINTENANCE' ||
          status === 'OCCUPIED'
        ) {
          return false;
        }

        const capacity = Number(room.capacity || 0);
        const occupied = Number(
          room.occupied ?? room.occupancy ?? 0,
        );

        if (capacity > 0 && occupied >= capacity) {
          return false;
        }

        return true;
      }),
    [rooms],
  );

  async function handleCheckIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentId || !roomId) {
      setError('Please select both a student and a room.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/hostel/rooms/allocate', {
        studentId,
        roomId,
      });

      setSuccess('Student checked in and room allocated successfully.');
      setStudentId('');
      setRoomId('');

      await loadData();
    } catch (err) {
      console.error('Check-in failed:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to check in the student.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckout(allocation: Allocation) {
    if (!allocation.studentId || !allocation.roomId) {
      setError('Unable to identify the student or room for checkout.');
      return;
    }

    const confirmed = window.confirm(
      `Check out ${getStudentName(allocation.student)} from ${getRoomName(
        allocation.room,
      )}?`,
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/hostel/rooms/deallocate', {
        studentId: allocation.studentId,
        roomId: allocation.roomId,
      });

      setSuccess('Student checked out successfully.');

      await loadData();
    } catch (err) {
      console.error('Checkout failed:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to check out the student.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="checkin-page">
      <style jsx>{`
        .checkin-page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 22px;
        }

        .page-title {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: var(--foreground, #111827);
        }

        .page-description {
          margin: 6px 0 0;
          color: var(--muted-foreground, #6b7280);
          font-size: 14px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .stat-card {
          padding: 17px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 14px;
          background: var(--card, #ffffff);
        }

        .stat-label {
          font-size: 12px;
          color: var(--muted-foreground, #6b7280);
          margin-bottom: 7px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--foreground, #111827);
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        .card {
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 14px;
          background: var(--card, #ffffff);
          overflow: hidden;
        }

        .card-header {
          padding: 17px 18px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .card-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--foreground, #111827);
        }

        .card-description {
          margin: 5px 0 0;
          font-size: 12px;
          color: var(--muted-foreground, #6b7280);
        }

        .form {
          padding: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 15px;
        }

        .label {
          font-size: 12px;
          font-weight: 600;
          color: var(--foreground, #374151);
        }

        .select,
        .search {
          width: 100%;
          height: 42px;
          box-sizing: border-box;
          padding: 0 11px;
          border: 1px solid var(--border, #d1d5db);
          border-radius: 9px;
          background: var(--background, #ffffff);
          color: var(--foreground, #111827);
          outline: none;
        }

        .select:focus,
        .search:focus {
          border-color: var(--foreground, #6b7280);
        }

        .primary-button {
          width: 100%;
          height: 42px;
          border: 0;
          border-radius: 9px;
          background: var(--foreground, #111827);
          color: var(--background, #ffffff);
          font-weight: 600;
          cursor: pointer;
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 18px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .tabs {
          display: flex;
          gap: 6px;
        }

        .tab {
          border: 1px solid transparent;
          background: transparent;
          color: var(--muted-foreground, #6b7280);
          border-radius: 8px;
          padding: 8px 11px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .tab.active {
          background: var(--secondary, #f3f4f6);
          color: var(--foreground, #111827);
        }

        .search-wrap {
          width: 220px;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 680px;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 13px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border, #e5e7eb);
          font-size: 13px;
        }

        th {
          background: var(--secondary, #f9fafb);
          color: var(--muted-foreground, #6b7280);
          font-weight: 700;
          white-space: nowrap;
        }

        td {
          color: var(--foreground, #374151);
        }

        tr:last-child td {
          border-bottom: 0;
        }

        .student-name {
          font-weight: 600;
          color: var(--foreground, #111827);
        }

        .secondary-text {
          margin-top: 3px;
          font-size: 11px;
          color: var(--muted-foreground, #6b7280);
        }

        .status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 700;
          background: var(--secondary, #f3f4f6);
          color: var(--foreground, #374151);
        }

        .checkout-button {
          border: 1px solid var(--border, #d1d5db);
          background: var(--background, #ffffff);
          color: var(--foreground, #111827);
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .checkout-button:hover {
          background: var(--secondary, #f3f4f6);
        }

        .empty {
          padding: 45px 20px;
          text-align: center;
          color: var(--muted-foreground, #6b7280);
          font-size: 14px;
        }

        .message {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 9px;
          font-size: 13px;
        }

        .error {
          border: 1px solid #ef4444;
          background: #fef2f2;
          color: #b91c1c;
        }

        .success {
          border: 1px solid #22c55e;
          background: #f0fdf4;
          color: #166534;
        }

        .mobile-list {
          display: none;
        }

        .mobile-item {
          padding: 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .mobile-item:last-child {
          border-bottom: 0;
        }

        .mobile-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 9px;
        }

        .mobile-label {
          font-size: 11px;
          color: var(--muted-foreground, #6b7280);
        }

        .mobile-value {
          text-align: right;
          font-size: 13px;
          font-weight: 600;
          color: var(--foreground, #111827);
        }

        @media (max-width: 1000px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 800px) {
          .stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .table-wrap {
            display: none;
          }

          .mobile-list {
            display: block;
          }

          .toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .search-wrap {
            width: 100%;
          }
        }

        @media (max-width: 560px) {
          .page-title {
            font-size: 22px;
          }

          .stats {
            gap: 9px;
          }

          .stat-card {
            padding: 12px;
          }

          .stat-value {
            font-size: 19px;
          }

          .stat-label {
            font-size: 11px;
          }

          .card-header {
            padding: 14px;
          }

          .form {
            padding: 14px;
          }

          .toolbar {
            padding: 13px;
          }

          .tabs {
            width: 100%;
          }

          .tab {
            flex: 1;
          }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Check-in / Checkout</h1>
        <p className="page-description">
          Manage student room allocation and checkout using the existing
          hostel room workflow.
        </p>
      </div>

      {error ? (
        <div className="message error">{error}</div>
      ) : null}

      {success ? (
        <div className="message success">{success}</div>
      ) : null}

      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Students</div>
          <div className="stat-value">{students.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Available Rooms</div>
          <div className="stat-value">{availableRooms.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Currently Checked In</div>
          <div className="stat-value">
            {activeAllocations.length}
          </div>
        </div>
      </div>

      <div className="content-grid">
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Check In Student</h2>
            <p className="card-description">
              Allocate an available room to a student.
            </p>
          </div>

          <form className="form" onSubmit={handleCheckIn}>
            <div className="field">
              <label className="label" htmlFor="student">
                Student
              </label>

              <select
                id="student"
                className="select"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                disabled={loading || submitting}
              >
                <option value="">Select student</option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {getStudentName(student)}
                    {student.admissionNumber
                      ? ` — ${student.admissionNumber}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="room">
                Room
              </label>

              <select
                id="room"
                className="select"
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                disabled={loading || submitting}
              >
                <option value="">Select available room</option>

                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {getRoomName(room)}
                    {room.capacity
                      ? ` — Capacity ${room.capacity}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loading || submitting}
            >
              {submitting ? 'Processing...' : 'Check In Student'}
            </button>
          </form>
        </section>

        <section className="card">
          <div className="toolbar">
            <div className="tabs">
              <button
                type="button"
                className={`tab ${
                  activeTab === 'active' ? 'active' : ''
                }`}
                onClick={() => setActiveTab('active')}
              >
                Active Check-ins
              </button>

              <button
                type="button"
                className={`tab ${
                  activeTab === 'history' ? 'active' : ''
                }`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
            </div>

            <div className="search-wrap">
              <input
                className="search"
                type="search"
                placeholder="Search student or room..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="empty">Loading check-in data...</div>
          ) : filteredAllocations.length === 0 ? (
            <div className="empty">
              No check-in records found.
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Room</th>
                      <th>Status</th>
                      <th>Check-in</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAllocations.map((allocation, index) => (
                      <tr
                        key={
                          allocation.id ||
                          `${allocation.studentId}-${allocation.roomId}-${index}`
                        }
                      >
                        <td>
                          <div className="student-name">
                            {getStudentName(allocation.student)}
                          </div>

                          {allocation.student?.admissionNumber ? (
                            <div className="secondary-text">
                              {allocation.student.admissionNumber}
                            </div>
                          ) : null}
                        </td>

                        <td>{getRoomName(allocation.room)}</td>

                        <td>
                          <span className="status">
                            {allocation.status || 'ACTIVE'}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            allocation.checkInDate ||
                              allocation.allocatedAt ||
                              allocation.createdAt,
                          )}
                        </td>

                        <td>
                          {activeTab === 'active' ? (
                            <button
                              type="button"
                              className="checkout-button"
                              disabled={submitting}
                              onClick={() =>
                                void handleCheckout(allocation)
                              }
                            >
                              Checkout
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-list">
                {filteredAllocations.map((allocation, index) => (
                  <div
                    className="mobile-item"
                    key={
                      allocation.id ||
                      `${allocation.studentId}-${allocation.roomId}-${index}`
                    }
                  >
                    <div className="mobile-row">
                      <span className="mobile-label">Student</span>
                      <span className="mobile-value">
                        {getStudentName(allocation.student)}
                      </span>
                    </div>

                    <div className="mobile-row">
                      <span className="mobile-label">Admission No.</span>
                      <span className="mobile-value">
                        {allocation.student?.admissionNumber || '—'}
                      </span>
                    </div>

                    <div className="mobile-row">
                      <span className="mobile-label">Room</span>
                      <span className="mobile-value">
                        {getRoomName(allocation.room)}
                      </span>
                    </div>

                    <div className="mobile-row">
                      <span className="mobile-label">Status</span>
                      <span className="mobile-value">
                        {allocation.status || 'ACTIVE'}
                      </span>
                    </div>

                    <div className="mobile-row">
                      <span className="mobile-label">Check-in</span>
                      <span className="mobile-value">
                        {formatDate(
                          allocation.checkInDate ||
                            allocation.allocatedAt ||
                            allocation.createdAt,
                        )}
                      </span>
                    </div>

                    {activeTab === 'active' ? (
                      <button
                        type="button"
                        className="checkout-button"
                        disabled={submitting}
                        onClick={() =>
                          void handleCheckout(allocation)
                        }
                      >
                        Checkout
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}