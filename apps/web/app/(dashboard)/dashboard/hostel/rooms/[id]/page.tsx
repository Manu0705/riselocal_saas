'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

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
  students?: {
    id: string;
    name: string;
    admissionNumber?: string | null;
  }[];
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type RoomDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function RoomDetailsPage({
  params,
}: RoomDetailsPageProps) {
  const [room, setRoom] = useState<HostelRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoom() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ApiResponse<HostelRoom>>(
          `/hostel/rooms/${encodeURIComponent(params.id)}`,
        );

        setRoom(response.data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load room',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadRoom();
  }, [params.id]);

  if (loading) {
    return <div>Loading room...</div>;
  }

  if (error) {
    return (
      <div>
        <Link
          href="/dashboard/hostel/rooms"
          style={{
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          ← Back to Rooms
        </Link>

        <div
          style={{
            marginTop: 24,
            padding: 24,
            color: '#b91c1c',
            background: 'var(--bg, #ffffff)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 12,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div>
        <Link
          href="/dashboard/hostel/rooms"
          style={{
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          ← Back to Rooms
        </Link>

        <div
          style={{
            marginTop: 24,
            padding: 24,
            color: 'var(--muted, #6b7280)',
          }}
        >
          Room not found.
        </div>
      </div>
    );
  }

  const occupied =
    room.occupiedBeds ?? room.occupied ?? 0;

  const capacity = room.capacity ?? 0;

  const vacant =
    room.vacantBeds ??
    room.vacant ??
    Math.max(capacity - occupied, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/dashboard/hostel/rooms"
          style={{
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          ← Back to Rooms
        </Link>

        <h1
          style={{
            margin: '16px 0 0',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--foreground, #111827)',
          }}
        >
          Room {room.roomNumber ?? '—'}
        </h1>

        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            color: 'var(--muted, #6b7280)',
          }}
        >
          View room information and occupancy.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
          minWidth: 0,
        }}
      >
        <InfoCard
          label="Room Number"
          value={room.roomNumber ?? '—'}
        />

        <InfoCard
          label="Floor"
          value={String(room.floor ?? '—')}
        />

        <InfoCard
          label="Capacity"
          value={String(capacity)}
        />

        <InfoCard
          label="Occupied"
          value={String(occupied)}
        />

        <InfoCard
          label="Vacant"
          value={String(vacant)}
        />

        <InfoCard
          label="Status"
          value={room.status ?? '—'}
        />
      </div>

      <div
        style={{
          width: '100%',
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--foreground, #111827)',
          }}
        >
          Room Occupancy
        </h2>

        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            color: 'var(--muted, #6b7280)',
          }}
        >
          {occupied} of {capacity} beds occupied.
        </p>
      </div>
      <div
        style={{
          width: '100%',
          marginTop: 24,
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--foreground, #111827)',
          }}
        >
          Allocated Students
        </h2>

        {!room.students?.length ? (
          <p
            style={{
              margin: '16px 0 0',
              fontSize: 14,
              color: 'var(--muted, #6b7280)',
            }}
          >
            No students are currently allocated to this room.
          </p>
        ) : (
          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gap: 12,
              minWidth: 0,
            }}
          >
            {room.students.map((student) => (
              <div
                key={student.id}
                style={{
                  padding: 14,
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: 10,
                  minWidth: 0,
                }}
              >
                <Link
                  href={`/dashboard/hostel/students/${student.id}`}
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {student.name}
                </Link>

                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: 'var(--muted, #6b7280)',
                  }}
                >
                  Admission No:{' '}
                  {student.admissionNumber ?? '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg, #ffffff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 12,
        padding: 18,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: 'var(--muted, #6b7280)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--foreground, #111827)',
        }}
      >
        {value}
      </div>
    </div>
  );
}