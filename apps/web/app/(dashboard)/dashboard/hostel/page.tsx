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

type RecentAllocationActivity = {
  id: string;
  roomId: string;
  studentId: string;
  action: string;
  happenedAt: string;
  room?: {
    id: string;
    roomNumber: string;
  } | null;
  student?: {
    id: string;
    name: string;
    admissionNumber?: string | null;
  } | null;
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
        minWidth: 0,
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

function OccupancyOverview({
  summary,
}: {
  summary: VacancySummary;
}) {
  const occupancyPercentage =
    summary.capacity > 0
      ? Math.round((summary.occupancy / summary.capacity) * 100)
      : 0;

  return (
    <section
      style={{
        marginTop: 16,
        background: 'var(--bg, #ffffff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 12,
        padding: 20,
        minWidth: 0,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 650,
            color: 'var(--foreground, #111827)',
          }}
        >
          Occupancy Overview
        </h2>

        <p
          style={{
            margin: '6px 0 0',
            fontSize: 13,
            color: 'var(--muted, #6b7280)',
          }}
        >
          Current room and bed occupancy status.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 16,
          marginTop: 20,
          minWidth: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted, #6b7280)',
            }}
          >
            Total Capacity
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--foreground, #111827)',
            }}
          >
            {summary.capacity}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted, #6b7280)',
            }}
          >
            Occupied
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--foreground, #111827)',
            }}
          >
            {summary.occupancy}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted, #6b7280)',
            }}
          >
            Available
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--foreground, #111827)',
            }}
          >
            {summary.vacancy}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'var(--muted, #6b7280)',
            marginBottom: 6,
          }}
        >
          <span>Occupancy</span>
          <span>{occupancyPercentage}%</span>
        </div>

        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: 'var(--border, #e5e7eb)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${occupancyPercentage}%`,
              height: '100%',
              borderRadius: 999,
              background: 'var(--foreground, #111827)',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 12,
          marginTop: 20,
          minWidth: 0,
        }}
      >
        <div
          style={{
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted, #6b7280)',
            }}
          >
            Full Rooms
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 18,
              fontWeight: 650,
            }}
          >
            {summary.full}
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted, #6b7280)',
            }}
          >
            Partial Rooms
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 18,
              fontWeight: 650,
            }}
          >
            {summary.partial}
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted, #6b7280)',
            }}
          >
            Vacant Rooms
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 18,
              fontWeight: 650,
            }}
          >
            {summary.vacant}
          </div>
        </div>
      </div>
    </section>
  );
}

function RecentRoomActivity({
  activities,
}: {
  activities: RecentAllocationActivity[];
}) {
  return (
    <section
      style={{
        marginTop: 24,
        padding: 20,
        background: 'var(--bg, #ffffff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--foreground, #111827)',
            }}
          >
            Recent Room Activity
          </h2>

          <p
            style={{
              margin: '6px 0 0',
              fontSize: 13,
              color: 'var(--muted, #6b7280)',
            }}
          >
            Latest room allocation activity.
          </p>
        </div>

        <Link
          href="/dashboard/hostel/rooms"
          style={{
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          View Rooms
        </Link>
      </div>

      {activities.length === 0 ? (
        <div
          style={{
            padding: '20px 0',
            fontSize: 13,
            color: 'var(--muted, #6b7280)',
          }}
        >
          No recent room activity.
        </div>
      ) : (
        <div>
          {activities.map((activity) => {
            const isAllocation = activity.action === 'ALLOCATED';

            return (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 0',
                  borderBottom:
                    '1px solid var(--border, #e5e7eb)',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--foreground, #111827)',
                    }}
                  >
                    {activity.student?.name ?? 'Unknown student'}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: 'var(--muted, #6b7280)',
                    }}
                  >
                    Room {activity.room?.roomNumber ?? '—'}
                    {activity.student?.admissionNumber
                      ? ` • ${activity.student.admissionNumber}`
                      : ''}
                  </div>
                </div>

                <div
                  style={{
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {isAllocation ? 'Allocated' : activity.action}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: 'var(--muted, #6b7280)',
                    }}
                  >
                    {new Date(
                      activity.happenedAt,
                    ).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
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
        minWidth: 0,
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
  const [recentActivity, setRecentActivity] = useState<
    RecentAllocationActivity[]
  >([]);

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
          setRecentActivity([]);
          return;
        }

        const [
          activityResult,
          vacancyResult,
          studentResult,
          summaryResult,
        ] = await Promise.allSettled([
          api.get<ApiResponse<RecentAllocationActivity[]>>(
            `/hostel/rooms/recent-activity?hostelId=${encodeURIComponent(
              hostelId,
            )}&limit=5`,
          ),
          api.get<ApiResponse<VacancySummary>>(
            `/hostel/rooms/vacancy-summary?hostelId=${encodeURIComponent(
              hostelId,
            )}`,
          ),
          api.get<ApiResponse<StudentPage>>(
            `/hostel/students?hostelId=${encodeURIComponent(
              hostelId,
            )}&page=1&limit=1`,
          ),
          api.get<ApiResponse<DashboardSummary>>(
            `/hostel/dashboard-summary?hostelId=${encodeURIComponent(
              hostelId,
            )}`,
          ),
        ]);

        if (activityResult.status === 'fulfilled') {
          setRecentActivity(activityResult.value.data);
        } else {
          setRecentActivity([]);
        }

        if (vacancyResult.status === 'fulfilled') {
          setVacancySummary(vacancyResult.value.data);
        } else {
          setVacancySummary(null);
        }

        if (studentResult.status === 'fulfilled') {
          setTotalStudents(studentResult.value.data.pagination.total);
        } else {
          setTotalStudents(null);
        }

        if (summaryResult.status === 'fulfilled') {
          setDashboardSummary(summaryResult.value.data);
        } else {
          setDashboardSummary(null);
        }
      } catch {
        setTotalStudents(null);
        setVacancySummary(null);
        setDashboardSummary(null);
        setRecentActivity([]);
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
          flexWrap: 'wrap',
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
              minWidth: 0,
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

          {vacancySummary && (
            <OccupancyOverview summary={vacancySummary} />
          )}

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
              minWidth: 0,
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
              minWidth: 0,
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

          {vacancySummary && (
            <OccupancyOverview summary={vacancySummary} />
          )}

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
              minWidth: 0,
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
              href="/dashboard/hostel/rooms/allocate"
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
              minWidth: 0,
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

          {vacancySummary && (
            <OccupancyOverview summary={vacancySummary} />
          )}

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
              minWidth: 0,
            }}
          >
            <ActionCard
              title="Room Allocation"
              description="View and manage room allocations."
              href="/dashboard/hostel/rooms/allocate"
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