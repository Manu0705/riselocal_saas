'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type HostelProperty = {
  id: string;
  name: string;
  status: string;
};

type HostelStudent = {
  id: string;
  name: string;
  admissionNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  paymentStatus: string;
  status: string;
  outstandingAmount?: string | number | null;
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

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export default function HostelStudentsPage() {
  const [students, setStudents] = useState<HostelStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        setError(null);

        const propertyResponse = await api.get<
          ApiResponse<HostelProperty[]>
        >('/hostel/properties');

        const hostelId = propertyResponse.data[0]?.id;

        if (!hostelId) {
          setStudents([]);
          return;
        }

        const studentResponse = await api.get<
          ApiResponse<StudentPage>
        >(
          `/hostel/students?hostelId=${encodeURIComponent(
            hostelId,
          )}&page=${page}&limit=25&search=${encodeURIComponent(search.trim())}`,
        );

        setStudents(studentResponse.data.items);
        setTotalPages(studentResponse.data.pagination.totalPages);
        setTotalStudents(studentResponse.data.pagination.total);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load students',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStudents();
  }, [page, search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
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
          Students
        </h1>

        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            color: 'var(--muted, #6b7280)',
          }}
        >
          View and manage students in your hostel.
        </p>
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
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search students..."
          style={{
            width: '100%',
            maxWidth: 360,
            height: 40,
            padding: '0 12px',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 8,
            background: 'var(--bg, #ffffff)',
            color: 'var(--foreground, #111827)',
            fontSize: 13,
            outline: 'none',
          }}
        />

        <div
          style={{
            fontSize: 13,
            color: 'var(--muted, #6b7280)',
          }}
        >
          {totalStudents} students
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
          <div style={{ padding: 24 }}>Loading students...</div>
        ) : error ? (
          <div
            style={{
              padding: 24,
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        ) : students.length === 0 ? (
          <div
            style={{
              padding: 24,
              color: 'var(--muted, #6b7280)',
            }}
          >
            No students found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 800,
              }}
            >
              <thead>
                <tr>
                  <th style={headerStyle}>Student</th>
                  <th style={headerStyle}>Admission No.</th>
                  <th style={headerStyle}>Phone</th>
                  <th style={headerStyle}>Payment Status</th>
                  <th style={headerStyle}>Outstanding</th>
                  <th style={headerStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
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
                      {student.paymentStatus}
                    </td>

                    <td style={cellStyle}>
                      ₹
                      {Number(
                        student.outstandingAmount ?? 0,
                      ).toLocaleString('en-IN')}
                    </td>

                    <td style={cellStyle}>
                      {student.status}
                    </td>
                  </tr>
                ))}
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
            onClick={() => setPage((current) => current - 1)}
            style={{
              height: 36,
              padding: '0 12px',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 8,
              background: 'var(--bg, #ffffff)',
              color: 'var(--foreground, #111827)',
              cursor:
                page === 1 || loading ? 'not-allowed' : 'pointer',
              opacity: page === 1 || loading ? 0.5 : 1,
            }}
          >
            Previous
          </button>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            style={{
              height: 36,
              padding: '0 12px',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 8,
              background: 'var(--bg, #ffffff)',
              color: 'var(--foreground, #111827)',
              cursor:
                page >= totalPages || loading ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages || loading ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
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
  whiteSpace: 'nowrap',
};

const cellStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 13,
  color: 'var(--foreground, #111827)',
  borderBottom: '1px solid var(--border, #e5e7eb)',
  whiteSpace: 'nowrap',
};