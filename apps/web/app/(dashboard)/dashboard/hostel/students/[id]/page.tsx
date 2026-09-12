'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type HostelStudent = {
  id: string;
  name: string;
  admissionNumber?: string | null;
  admissionDate?: string | null;
  phone?: string | null;
  email?: string | null;
  paymentStatus: string;
  status: string;
  outstandingAmount?: string | number | null;
  room?: {
    id: string;
    roomNumber?: string | null;
  } | null;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type StudentDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function StudentDetailsPage({
  params,
}: StudentDetailsPageProps) {
  const [student, setStudent] = useState<HostelStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deallocating, setDeallocating] = useState(false);

  useEffect(() => {
    async function loadStudent() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ApiResponse<HostelStudent>>(
          `/hostel/students/${encodeURIComponent(params.id)}`,
        );

        setStudent(response.data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load student',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStudent();
  }, [params.id]);

  async function handleDeallocate() {
    if (!student?.room?.id) {
      return;
    }

    try {
      setDeallocating(true);
      setError(null);

      await api.post('/hostel/rooms/deallocate', {
        studentId: student.id,
        roomId: student.room.id,
      });

      setStudent((currentStudent) =>
        currentStudent
          ? {
              ...currentStudent,
              room: null,
            }
          : currentStudent,
      );
    } catch (deallocateError) {
      setError(
        deallocateError instanceof Error
          ? deallocateError.message
          : 'Failed to deallocate student',
      );
    } finally {
      setDeallocating(false);
    }
  }

  if (loading) {
    return <div>Loading student...</div>;
  }

  if (error) {
    return (
      <div className="w-full min-w-0">
        <p
          className="break-words"
          style={{ color: '#b91c1c' }}
        >
          {error}
        </p>

        <Link href="/dashboard/hostel/students">
          ← Back to Students
        </Link>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="w-full min-w-0">
        <p>Student not found.</p>

        <Link href="/dashboard/hostel/students">
          ← Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {/* Header */}
      <div className="mb-6 min-w-0">
        <Link
          href="/dashboard/hostel/students"
          className="text-[13px] text-[var(--muted,#6b7280)] no-underline"
        >
          ← Back to Students
        </Link>

        <h1
          className="break-words"
          style={{
            margin: '12px 0 0',
            fontSize: 'clamp(24px, 5vw, 28px)',
            fontWeight: 700,
            color: 'var(--foreground, #111827)',
          }}
        >
          {student.name}
        </h1>
      </div>

      <div
        className="student-details-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 16,
          minWidth: 0,
          width: '100%',
        }}
      >
        <InfoCard
          label="Admission Number"
          value={student.admissionNumber ?? '—'}
        />

        <InfoCard
          label="Admission Date"
          value={
            student.admissionDate
              ? new Date(
                  student.admissionDate,
                ).toLocaleDateString('en-IN')
              : '—'
          }
        />

        <InfoCard
          label="Phone"
          value={student.phone ?? '—'}
        />

        <InfoCard
          label="Email"
          value={student.email ?? '—'}
        />

        <InfoCard
          label="Status"
          value={student.status}
        />

        {/* Room */}
        {student.room ? (
          <div
            style={{
              background: 'var(--bg, #ffffff)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 12,
              padding: 20,
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: 'var(--muted, #6b7280)',
              }}
            >
              Room
            </div>

            <Link
              href={`/dashboard/hostel/rooms/${encodeURIComponent(
                student.room.id,
              )}`}
              className="break-words"
              style={{
                display: 'inline-block',
                maxWidth: '100%',
                marginTop: 8,
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--foreground, #111827)',
                textDecoration: 'none',
              }}
            >
              {student.room.roomNumber ?? '—'}
            </Link>
          </div>
        ) : (
          <InfoCard
            label="Room"
            value="Not allocated"
          />
        )}

        {/* Deallocate */}
        {student.room && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              background: 'var(--bg, #ffffff)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 12,
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              onClick={() => void handleDeallocate()}
              disabled={deallocating}
              style={{
                width: '100%',
                minWidth: 0,
                padding: '10px 14px',
                border: '1px solid #fecaca',
                borderRadius: 8,
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: 14,
                fontWeight: 600,
                cursor: deallocating
                  ? 'not-allowed'
                  : 'pointer',
                opacity: deallocating ? 0.6 : 1,
              }}
            >
              {deallocating
                ? 'Deallocating...'
                : 'Deallocate Student'}
            </button>
          </div>
        )}

        <InfoCard
          label="Payment Status"
          value={student.paymentStatus}
        />

        <InfoCard
          label="Outstanding Amount"
          value={`₹${Number(
            student.outstandingAmount ?? 0,
          ).toLocaleString('en-IN')}`}
        />
      </div>

      <style jsx>{`
        @media (max-width: 520px) {
          .student-details-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
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
        padding: 20,
        minWidth: 0,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: 'var(--muted, #6b7280)',
        }}
      >
        {label}
      </div>

      <div
        className="break-words"
        style={{
          marginTop: 8,
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--foreground, #111827)',
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </div>
    </div>
  );
}