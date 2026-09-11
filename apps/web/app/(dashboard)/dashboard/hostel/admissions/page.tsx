'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type HostelStudent = {
  id: string;
  name: string;
  admissionNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  room?: {
    id: string;
    roomNumber?: string | null;
  } | null;
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

export default function AdmissionsPage() {
  const [students, setStudents] = useState<HostelStudent[]>([]);
  const [property, setProperty] = useState<HostelProperty | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 25;

  useEffect(() => {
    async function loadAdmissions() {
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

        const query = new URLSearchParams({
          hostelId: firstProperty.id,
          page: String(page),
          limit: String(limit),
        });

        if (search.trim()) {
          query.set('search', search.trim());
        }

        const studentsResponse = await api.get<
          ApiResponse<StudentPage>
        >(`/hostel/students?${query.toString()}`);

        setStudents(studentsResponse.data.items ?? []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load admissions.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAdmissions();
  }, [page, search]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--foreground, #111827)',
            }}
          >
            Admissions
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              fontSize: 14,
              color: 'var(--muted, #6b7280)',
            }}
          >
            Manage hostel student admissions.
          </p>
        </div>

        <Link
          href="/dashboard/hostel/admissions/new"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: 'var(--primary, #111827)',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + New Admission
        </Link>
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

      <div
        style={{
          marginBottom: 16,
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name, admission number, phone..."
          style={{
            width: '100%',
            padding: '11px 12px',
            border: '1px solid var(--border, #d1d5db)',
            borderRadius: 8,
            background: 'var(--bg, #ffffff)',
            color: 'var(--foreground, #111827)',
            fontSize: 14,
          }}
        />
      </div>

      <div
        style={{
          overflowX: 'auto',
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 850,
          }}
        >
          <thead>
            <tr>
              <th style={headerStyle}>Student</th>
              <th style={headerStyle}>Admission No.</th>
              <th style={headerStyle}>Phone</th>
              <th style={headerStyle}>Room</th>
              <th style={headerStyle}>Payment</th>
              <th style={headerStyle}>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--muted, #6b7280)',
                  }}
                >
                  Loading admissions...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--muted, #6b7280)',
                  }}
                >
                  No admissions found.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id}>
                  <td style={cellStyle}>
                    <Link
                      href={`/dashboard/hostel/students/${student.id}`}
                      style={{
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      {student.name}
                    </Link>
                  </td>

                  <td style={cellStyle}>
                    {student.admissionNumber ?? '—'}
                  </td>

                  <td style={cellStyle}>
                    {student.phone ?? '—'}
                  </td>

                  <td style={cellStyle}>
                    {student.room ? (
                      <Link
                        href={`/dashboard/hostel/rooms/${encodeURIComponent(
                          student.room.id,
                        )}`}
                        style={{
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        {student.room.roomNumber ?? '—'}
                      </Link>
                    ) : (
                      'Not allocated'
                    )}
                  </td>

                  <td style={cellStyle}>
                    {student.paymentStatus ?? '—'}
                  </td>

                  <td style={cellStyle}>
                    {student.status ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginTop: 16,
        }}
      >
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => setPage((currentPage) => currentPage - 1)}
          style={paginationButtonStyle}
        >
          ← Previous
        </button>

        <span
          style={{
            fontSize: 14,
            color: 'var(--muted, #6b7280)',
          }}
        >
          Page {page}
        </span>

        <button
          type="button"
          disabled={
            loading || students.length < limit
          }
          onClick={() => setPage((currentPage) => currentPage + 1)}
          style={paginationButtonStyle}
        >
          Next →
        </button>
      </div>

      {property && (
        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: 'var(--muted, #6b7280)',
          }}
        >
          Property: {property.name}
        </div>
      )}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--muted, #6b7280)',
  borderBottom: '1px solid var(--border, #e5e7eb)',
};

const cellStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 14,
  color: 'var(--foreground, #111827)',
  borderBottom: '1px solid var(--border, #e5e7eb)',
};

const paginationButtonStyle: React.CSSProperties = {
  padding: '9px 14px',
  border: '1px solid var(--border, #d1d5db)',
  borderRadius: 8,
  background: 'var(--bg, #ffffff)',
  color: 'var(--foreground, #111827)',
  fontSize: 14,
  cursor: 'pointer',
};