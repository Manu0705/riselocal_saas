'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type HostelStudent = {
  id: string;
  name: string;
  admissionNumber?: string | null;
  status?: string | null;
  room?: {
    id: string;
    roomNumber?: string | null;
  } | null;
};

type HostelRoom = {
  id: string;
  roomNumber?: string | null;
  floor?: string | number | null;
  capacity?: number | null;
  occupancy?: number | null;
  occupied?: number | null;
  occupiedBeds?: number | null;
  vacant?: number | null;
  vacantBeds?: number | null;
  status?: string | null;
  beds?: HostelBed[];
};

type HostelBed = {
  id: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'INACTIVE';
  studentId?: string | null;
  student?: { id: string; name: string; admissionNumber?: string | null } | null;
};

type HostelProperty = {
  id: string;
  name: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type StudentPage = {
  items: HostelStudent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type RoomPage = {
  items: HostelRoom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function RoomAllocationPage() {
  const [property, setProperty] = useState<HostelProperty | null>(null);
  const [students, setStudents] = useState<HostelStudent[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');

  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadAllocationData() {
      try {
        setLoading(true);
        setError(null);

        const propertyResponse = await api.get<
          ApiResponse<HostelProperty[]>
        >('/hostel/properties');

        const firstProperty = propertyResponse.data?.[0];

        if (!firstProperty) {
          throw new Error('No hostel property found.');
        }

        setProperty(firstProperty);

        const [studentsResponse, roomsResponse] = await Promise.all([
          api.get<ApiResponse<StudentPage>>(
            `/hostel/students?hostelId=${encodeURIComponent(
              firstProperty.id,
            )}&page=1&limit=100`,
          ),
          api.get<ApiResponse<RoomPage>>(
            `/hostel/rooms?hostelId=${encodeURIComponent(firstProperty.id)}`,
          ),
        ]);

        setStudents(studentsResponse.data.items ?? []);
        setRooms(
          Array.isArray(roomsResponse.data?.items)
          ? roomsResponse.data.items
          : [],
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load room allocation data.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAllocationData();
  }, []);

  const selectedRoom = rooms.find(
    (room) => room.id === selectedRoomId,
  );
  const selectableBeds = (selectedRoom?.beds ?? []).filter(
    (bed) =>
      bed.status === 'AVAILABLE' ||
      (bed.status === 'RESERVED' && bed.studentId === selectedStudentId),
  );

  const capacity = selectedRoom?.capacity ?? 0;

  const occupied =
    selectedRoom?.occupancy ??
    selectedRoom?.occupiedBeds ??
    selectedRoom?.occupied ??
    0;

  const vacant =
    selectedRoom?.beds
      ? selectedRoom.beds.filter((bed) => bed.status === 'AVAILABLE').length
      : selectedRoom?.vacantBeds ??
    selectedRoom?.vacant ??
    Math.max(capacity - occupied, 0);

  async function handleAllocate() {
    if (!property?.id) {
      setError('No hostel property found.');
      setSuccess(null);
      return;
    }

    if (!selectedStudentId) {
      setError('Please select a student.');
      setSuccess(null);
      return;
    }

    if (!selectedRoomId) {
      setError('Please select a room.');
      setSuccess(null);
      return;
    }

    if (!selectedBedId) {
      setError('Please select a bed.');
      setSuccess(null);
      return;
    }

    try {
      setAllocating(true);
      setError(null);
      setSuccess(null);

      await api.post('/hostel/rooms/allocate', {
        hostelId: property.id,
        studentId: selectedStudentId,
        roomId: selectedRoomId,
        bedId: selectedBedId,
      });

      setSuccess('Student allocated successfully.');

      setSelectedStudentId('');
      setSelectedRoomId('');
      setSelectedBedId('');

      const roomsResponse = await api.get<ApiResponse<RoomPage>>(
        `/hostel/rooms?hostelId=${encodeURIComponent(property.id)}`,
      );

      setRooms(
        Array.isArray(roomsResponse.data?.items)
        ? roomsResponse.data.items
        : [],
      );
    } catch (allocationError) {
      setError(
        allocationError instanceof Error
          ? allocationError.message
          : 'Failed to allocate student.',
      );
    } finally {
      setAllocating(false);
    }
  }

  async function handleReserve() {
    if (!property?.id || !selectedStudentId || !selectedRoomId || !selectedBedId) {
      setError('Select a student, room, and available bed to reserve.');
      setSuccess(null);
      return;
    }

    try {
      setAllocating(true);
      setError(null);
      setSuccess(null);
      await api.post('/hostel/rooms/reserve', {
        hostelId: property.id,
        studentId: selectedStudentId,
        roomId: selectedRoomId,
        bedId: selectedBedId,
      });
      setSuccess('Bed reserved for the student.');
      const roomsResponse = await api.get<ApiResponse<RoomPage>>(
        `/hostel/rooms?hostelId=${encodeURIComponent(property.id)}`,
      );
      setRooms(Array.isArray(roomsResponse.data?.items) ? roomsResponse.data.items : []);
    } catch (reservationError) {
      setError(
        reservationError instanceof Error
          ? reservationError.message
          : 'Failed to reserve bed.',
      );
    } finally {
      setAllocating(false);
    }
  }

  if (loading) {
    return <div>Loading room allocation...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--foreground, #111827)',
          }}
        >
          Room Allocation
        </h1>

        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            color: 'var(--muted, #6b7280)',
          }}
        >
          Allocate a student to an available room.
        </p>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            color: '#b91c1c',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            color: '#166534',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
          }}
        >
          {success}
        </div>
      )}

      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="student"
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Student
          </label>

          <select
            id="student"
            value={selectedStudentId}
            onChange={(event) =>
              setSelectedStudentId(event.target.value)
            }
            style={inputStyle}
          >
            <option value="">Select student</option>

            {students
                .filter(
                  (student) =>
                    !student.room &&
                    !rooms.some((room) =>
                      room.beds?.some(
                        (bed) => bed.studentId === student.id && bed.status === 'OCCUPIED',
                      ),
                    ),
                )
                .map((student) => (
                    <option key={student.id} value={student.id}>
                    {student.name}
                    {student.admissionNumber
                        ? ` — ${student.admissionNumber}`
                        : ''}
                    </option>
                ))}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="room"
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Room
          </label>

          <select
            id="room"
            value={selectedRoomId}
            onChange={(event) =>
              {
                setSelectedRoomId(event.target.value);
                setSelectedBedId('');
              }
            }
            style={inputStyle}
          >
            <option value="">Select room</option>

            {rooms.map((room) => {
              const roomCapacity = room.capacity ?? 0;

              const roomOccupied =
                room.occupancy ??
                room.occupiedBeds ??
                room.occupied ??
                0;

              const roomVacant =
                room.vacantBeds ??
                room.vacant ??
                Math.max(roomCapacity - roomOccupied, 0);

              return (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber ?? '—'} —{' '}
                  {roomVacant} vacant / {roomCapacity} beds
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="bed" style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            Bed
          </label>
          <select
            id="bed"
            value={selectedBedId}
            onChange={(event) => setSelectedBedId(event.target.value)}
            disabled={!selectedRoom}
            style={inputStyle}
          >
            <option value="">Select available bed</option>
            {selectableBeds.map((bed) => (
              <option key={bed.id} value={bed.id}>
                {bed.bedNumber}{bed.status === 'RESERVED' ? ' · Reserved for this student' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedRoom && (
          <div
            style={{
              marginBottom: 20,
              padding: 16,
              background: 'var(--surface, #f9fafb)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Room {selectedRoom.roomNumber ?? '—'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 12,
              }}
            >
              <MiniInfo label="Floor" value={String(selectedRoom.floor ?? '—')} />
              <MiniInfo label="Capacity" value={String(capacity)} />
              <MiniInfo label="Occupied" value={String(occupied)} />
              <MiniInfo label="Vacant" value={String(vacant)} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => void handleReserve()}
            disabled={allocating || !selectedBedId || selectableBeds.find((bed) => bed.id === selectedBedId)?.status !== 'AVAILABLE'}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid var(--border, #d1d5db)',
              borderRadius: 10,
              background: 'var(--bg, #ffffff)',
              color: 'var(--foreground, #111827)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Reserve Bed
          </button>
          <button
            type="button"
            onClick={() => void handleAllocate()}
            disabled={allocating || !selectedBedId}
            style={{
            flex: 1,
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            borderRadius: 10,
            background: 'var(--primary, #111827)',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            cursor: allocating ? 'not-allowed' : 'pointer',
            opacity: allocating ? 0.6 : 1,
          }}
        >
          {allocating ? 'Allocating...' : 'Allocate Student'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  padding: '11px 12px',
  border: '1px solid var(--border, #d1d5db)',
  borderRadius: 8,
  background: 'var(--bg, #ffffff)',
  color: 'var(--foreground, #111827)',
  fontSize: 14,
};

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--muted, #6b7280)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}