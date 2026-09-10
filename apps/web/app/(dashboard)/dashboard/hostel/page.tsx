'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api-client';

type StatCardProps = {
  label: string;
  value: string;
  description: string;
};

type HostelProperty = {
  id: string;
  name: string;
  status: string;
};

type StudentPage = {
  items: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type VacancySummary = {
  rooms: number;
  capacity: number;
  occupancy: number;
  vacancy: number;
  full: number;
  vacant: number;
  partial: number;
};

type DashboardSummary = {
  outstandingFees: number;
  paidPayments: number;
  paidPaymentCount: number;
  pendingPaymentCount: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg, #ffffff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: 'var(--muted, #6b7280)',
          fontWeight: 500,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 28,
          lineHeight: 1.2,
          fontWeight: 700,
          color: 'var(--foreground, #111827)',
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 12,
          color: 'var(--muted, #6b7280)',
        }}
      >
        {description}
      </div>
    </div>
  );
}

type ActionCardProps = {
  title: string;
  description: string;
  href: string;
};

function ActionCard({ title, description, href }: ActionCardProps) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 18,
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 12,
        background: 'var(--bg, #ffffff)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 650,
          color: 'var(--foreground, #111827)',
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--muted, #6b7280)',
        }}
      >
        {description}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Open →
      </div>
    </Link>
  );
}

export default function HostelDashboardPage() {
  const { userName, userRole } = useAuth();
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [vacancySummary, setVacancySummary] = useState<VacancySummary | null>(null);
  const [dashboardSummary, setDashboardSummary] =
    useState<DashboardSummary | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const propertyResponse = await api.get<
          ApiResponse<HostelProperty[]>
        >('/hostel/properties');

        const hostelId = propertyResponse.data[0]?.id;

        if (!hostelId) {
          setTotalStudents(0);
          setVacancySummary(null);
          setDashboardSummary(null);
          return;
        }

        const vacancyResponse = await api.get<
          ApiResponse<VacancySummary>
        >(
          `/hostel/rooms/vacancy-summary?hostelId=${encodeURIComponent(
            hostelId,
          )}`,
        );

        setVacancySummary(vacancyResponse.data);

        const studentResponse = await api.get<
          ApiResponse<StudentPage>
        >(
          `/hostel/students?hostelId=${encodeURIComponent(
            hostelId,
          )}&page=1&limit=1`,
        );

        setTotalStudents(studentResponse.data.pagination.total);

        const summaryResponse = await api.get<
          ApiResponse<DashboardSummary>
        >(
          `/hostel/dashboard-summary?hostelId=${encodeURIComponent(
            hostelId,
          )}`,
        );

        setDashboardSummary(summaryResponse.data);

      } catch {
        setTotalStudents(null);
        setVacancySummary(null);
        setDashboardSummary(null);
      }
    }

    void loadDashboardData();
  }, []);

  const roleLabel = userRole
    ? `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}`
    : 'User';

  const isOwner = userRole === 'owner';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--muted, #6b7280)',
              marginBottom: 4,
            }}
          >
            {roleLabel} Dashboard
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 28,
              lineHeight: 1.2,
              fontWeight: 700,
              color: 'var(--foreground, #111827)',
            }}
          >
            Welcome{userName ? `, ${userName}` : ''}
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              fontSize: 14,
              color: 'var(--muted, #6b7280)',
            }}
          >
            {isOwner &&
              'Monitor your hostel business, finances, occupancy and staff.'}

            {isManager &&
              'Manage admissions, students, rooms, fees and daily hostel operations.'}

            {isStaff &&
              'Manage today’s hostel activities, students, rooms and collections.'}

            {!isOwner && !isManager && !isStaff &&
              'Here is an overview of your hostel operations.'}
          </p>
        </div>

        <Link
          href="/dashboard/hostel/operations"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 40,
            padding: '0 14px',
            borderRadius: 8,
            border: '1px solid var(--border, #e5e7eb)',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--foreground, #374151)',
            background: 'var(--bg, #ffffff)',
          }}
        >
          Hostel Operations
        </Link>
      </div>

      {/* Owner dashboard */}
      {isOwner && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 16,
            }}
          >
            <StatCard
              label="Total Students"
              value={totalStudents === null ? '—' : String(totalStudents)}
              description="Students currently registered"
            />

            <StatCard
              label="Occupancy"
              value={
                vacancySummary
                  ? `${vacancySummary.occupancy}/${vacancySummary.capacity}`
                  : '—'
              }
              description="Occupied beds / total capacity"
            />

            <StatCard
              label="Outstanding Fees"
              value={
                dashboardSummary === null
                  ? '—'
                  : `₹${dashboardSummary.outstandingFees.toLocaleString('en-IN')}`
              }
              description="Pending fee collection"
            />

            <StatCard
              label="Payments"
              value={
                dashboardSummary === null
                  ? '—'
                  : `₹${dashboardSummary.paidPayments.toLocaleString('en-IN')}`
              }
              description="Payments received"
            />
          </div>

          <section
            style={{
              marginTop: 16,
              background: 'var(--bg, #ffffff)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 650 }}>
              Business Overview
            </h2>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: 'var(--muted, #6b7280)',
              }}
            >
              Revenue, occupancy, fee collection, staff activity and reports
              will appear here.
            </p>
          </section>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 16,
              marginTop: 16,
            }}
          >
            <ActionCard
              title="Students"
              description="View and manage hostel students."
              href="/dashboard/hostel/students"
            />

            <ActionCard
              title="Payments"
              description="Review collections and payment activity."
              href="/dashboard/hostel/payments"
            />

            <ActionCard
              title="Reports"
              description="View hostel reports and business insights."
              href="/dashboard/hostel/reports"
            />
          </div>
        </>
      )}

      {/* Manager dashboard */}
      {isManager && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 16,
            }}
          >
            <StatCard
              label="Students"
              value={totalStudents === null ? '—' : String(totalStudents)}
              description="Active hostel students"
            />

            <StatCard
              label="Rooms"
              value={vacancySummary ? String(vacancySummary.rooms) : '—'}
              description="Total hostel rooms"
            />

            <StatCard
              label="Vacancies"
              value={vacancySummary ? String(vacancySummary.vacancy) : '—'}
              description="Available beds"
            />

            <StatCard
              label="Pending Fees"
              value={
                dashboardSummary === null
                  ? '—'
                  : `₹${dashboardSummary.outstandingFees.toLocaleString('en-IN')}`
              }
              description="Fees awaiting collection"
            />
          </div>

          <section
            style={{
              marginTop: 16,
              background: 'var(--bg, #ffffff)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 650 }}>
              Manager Operations
            </h2>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: 'var(--muted, #6b7280)',
              }}
            >
              Admissions, student management, room allocation, fees and
              complaints will appear here.
            </p>
          </section>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 16,
              marginTop: 16,
            }}
          >
            <ActionCard
              title="Admissions"
              description="Manage new hostel admissions."
              href="/dashboard/hostel/admissions"
            />

            <ActionCard
              title="Room Allocation"
              description="Allocate and manage student rooms."
              href="/dashboard/hostel/room-allocation"
            />

            <ActionCard
              title="Fees & Billing"
              description="Manage student fees and outstanding balances."
              href="/dashboard/hostel/fees"
            />
          </div>
        </>
      )}

      {/* Staff dashboard */}
      {isStaff && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 16,
            }}
          >
            <StatCard
              label="Today's Check-ins"
              value="—"
              description="Students checking in today"
            />

            <StatCard
              label="Today's Check-outs"
              value="—"
              description="Students checking out today"
            />

            <StatCard
              label="Pending Collections"
              value={
                dashboardSummary === null
                  ? '—'
                  : String(dashboardSummary.pendingPaymentCount)
              }
              description="Payments requiring attention"
            />
          </div>

          <section
            style={{
              marginTop: 16,
              background: 'var(--bg, #ffffff)',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 650 }}>
              Today's Operations
            </h2>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: 'var(--muted, #6b7280)',
              }}
            >
              Check-ins, check-outs, room allocation, collections and
              complaints will appear here.
            </p>
          </section>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 16,
              marginTop: 16,
            }}
          >
            <ActionCard
              title="Room Allocation"
              description="View and manage room allocations."
              href="/dashboard/hostel/room-allocation"
            />

            <ActionCard
              title="Payments"
              description="Collect and manage student payments."
              href="/dashboard/hostel/payments"
            />

            <ActionCard
              title="Complaints"
              description="View and manage student complaints."
              href="/dashboard/hostel/complaints"
            />
          </div>
        </>
      )}

      {/* Fallback */}
      {!isOwner && !isManager && !isStaff && (
        <section
          style={{
            background: 'var(--bg, #ffffff)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p style={{ margin: 0 }}>
            Your account does not have a Hostel management role.
          </p>
        </section>
      )}

      {/* Responsive */}
      <style jsx>{`
        @media (max-width: 900px) {
          div[style*='repeat(4'] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          div[style*='repeat(3'] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 520px) {
          div[style*='repeat(4'],
          div[style*='repeat(3'] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}