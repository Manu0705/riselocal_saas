'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type HostelProperty = {
  id: string;
  name: string;
  status: string;
};

type HostelRoom = {
  id: string;
  roomNumber?: string | null;
  floor?: string | number | null;
  capacity?: number | null;
  occupied?: number | null;
  occupiedBeds?: number | null;
  vacant?: number | null;
  vacantBeds?: number | null;
  status?: string | null;
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

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export default function HostelRoomsPage() {
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);

  useEffect(() => {
    async function loadRooms() {
      try {
        setLoading(true);
        setError(null);

        const propertyResponse = await api.get<
          ApiResponse<HostelProperty[]>
        >('/hostel/properties');

        const hostelId = propertyResponse.data[0]?.id;

        if (!hostelId) {
          setRooms([]);
          setTotalPages(1);
          setTotalRooms(0);
          return;
        }

        const roomResponse = await api.get<ApiResponse<RoomPage>>(
          `/hostel/rooms?hostelId=${encodeURIComponent(
            hostelId,
          )}&page=${page}&limit=25&search=${encodeURIComponent(
            search.trim(),
          )}`,
        );

        setRooms(
          Array.isArray(roomResponse.data?.items)
            ? roomResponse.data.items
            : [],
        );

        setTotalPages(
          roomResponse.data?.pagination?.totalPages ?? 1,
        );

        setTotalRooms(
          roomResponse.data?.pagination?.total ?? 0,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load rooms',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadRooms();
  }, [page, search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            minWidth: 0,
            flex: '1 1 260px',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--foreground, #111827)',
            }}
          >
            Rooms
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              fontSize: 14,
              color: 'var(--muted, #6b7280)',
            }}
          >
            View and manage rooms in your hostel.
          </p>
        </div>

        <Link
          href="/dashboard/hostel/rooms/allocate"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 40,
            padding: '0 14px',
            borderRadius: 8,
            border: '1px solid var(--primary, #2563eb)',
            background: 'var(--primary, #2563eb)',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          + Allocate Room
        </Link>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(event) =>
            handleSearchChange(event.target.value)
          }
          placeholder="Search rooms..."
          style={{
            width: '100%',
            maxWidth: 360,
            minWidth: 0,
            height: 40,
            padding: '0 12px',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 8,
            background: 'var(--bg, #ffffff)',
            color: 'var(--foreground, #111827)',
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <div
          style={{
            fontSize: 13,
            color: 'var(--muted, #6b7280)',
          }}
        >
          {totalRooms} rooms
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 24 }}>Loading rooms...</div>
        ) : error ? (
          <div
            style={{
              padding: 24,
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        ) : rooms.length === 0 ? (
          <div
            style={{
              padding: 24,
              color: 'var(--muted, #6b7280)',
            }}
          >
            No rooms found.
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 620,
              }}
            >
              <thead>
                <tr>
                  <th style={headerStyle}>Room</th>
                  <th style={headerStyle}>Floor</th>
                  <th style={headerStyle}>Capacity</th>
                  <th style={headerStyle}>Occupied</th>
                  <th style={headerStyle}>Vacant</th>
                  <th style={headerStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {rooms.map((room) => {
                  const occupied =
                    room.occupiedBeds ?? room.occupied ?? 0;

                  const capacity = room.capacity ?? 0;

                  const vacant =
                    room.vacantBeds ??
                    room.vacant ??
                    Math.max(capacity - occupied, 0);

                  return (
                    <tr key={room.id}>
                      <td style={cellStyle}>
                        <Link
                          href={`/dashboard/hostel/rooms/${room.id}`}
                          style={{
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          {room.roomNumber ?? '—'}
                        </Link>
                      </td>

                      <td style={cellStyle}>
                        {room.floor ?? '—'}
                      </td>

                      <td style={cellStyle}>{capacity}</td>

                      <td style={cellStyle}>{occupied}</td>

                      <td style={cellStyle}>{vacant}</td>

                      <td style={cellStyle}>
                        {room.status ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: 'var(--muted, #6b7280)',
          }}
        >
          Page {page} of {totalPages}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            type="button"
            disabled={page === 1 || loading}
            onClick={() =>
              setPage((current) => current - 1)
            }
            style={buttonStyle(page === 1 || loading)}
          >
            Previous
          </button>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() =>
              setPage((current) => current + 1)
            }
            style={buttonStyle(page >= totalPages || loading)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    height: 36,
    padding: '0 12px',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: 8,
    background: 'var(--bg, #ffffff)',
    color: 'var(--foreground, #111827)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}

const headerStyle: React.CSSProperties = {
  padding: '12px 12px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--muted, #6b7280)',
  borderBottom: '1px solid var(--border, #e5e7eb)',
  whiteSpace: 'nowrap',
};

const cellStyle: React.CSSProperties = {
  padding: '12px 12px',
  fontSize: 13,
  color: 'var(--foreground, #111827)',
  borderBottom: '1px solid var(--border, #e5e7eb)',
  whiteSpace: 'nowrap',
};