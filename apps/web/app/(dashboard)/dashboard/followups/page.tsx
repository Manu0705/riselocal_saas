'use client';

import { useMemo } from 'react';
import FollowupCard from '@/components/followup-card';
import { useDashboardData } from '@/context/DashboardDataContext';
import MobilePageTitle from '../components/mobile-page-title';

function classifyFollowup(item: any): 'today' | 'overdue' | 'upcoming' | 'unscheduled' {
  const followUpAt = item?.followUpAt;
  if (!followUpAt) return 'unscheduled';
  const now = Date.now();
  const followUp = new Date(followUpAt).getTime();
  const diffMs = followUp - now;
  if (diffMs < 0) return 'overdue';
  if (diffMs < 24 * 60 * 60 * 1000) return 'today';
  return 'upcoming';
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <p
      style={{
        margin: '16px 0 8px',
        fontWeight: 700,
        fontSize: 13,
        color,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </p>
  );
}

export default function FollowupsPage() {
  const { leads, metrics, loading, error } = useDashboardData();

  const { today, overdue, upcoming, unscheduled } = useMemo(() => {
    const items = leads.filter((item) => {
      const status = String(item?.status ?? '')
        .trim()
        .toUpperCase();
      return status === 'QUALIFIED' || status === 'FOLLOW-UP' || status === 'FOLLOWUP';
    });

    return {
      today: items.filter((i) => classifyFollowup(i) === 'today'),
      overdue: items.filter((i) => classifyFollowup(i) === 'overdue'),
      upcoming: items.filter((i) => classifyFollowup(i) === 'upcoming'),
      unscheduled: items.filter((i) => classifyFollowup(i) === 'unscheduled'),
    };
  }, [leads]);

  const allEmpty = today.length === 0 && overdue.length === 0 && upcoming.length === 0 && unscheduled.length === 0;

  return (
    <div style={{ padding: 16, color: 'var(--text)' }}>
      <MobilePageTitle title="Followups" />

      {loading ? <p style={{ color: 'var(--muted)' }}>Loading follow-ups...</p> : null}
      {error ? <p style={{ color: '#b91c1c' }}>Error: {error}</p> : null}

      {!loading && !error ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                border: '1px solid var(--card-border)',
                borderRadius: 10,
                padding: 10,
                background: 'var(--card)',
              }}
            >
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Total Followups</p>
              <p style={{ margin: '4px 0 0', color: '#22c55e', fontSize: 18, fontWeight: 700 }}>
                {metrics.followUpLeads}
              </p>
            </div>
            <div
              style={{
                border: '1px solid var(--card-border)',
                borderRadius: 10,
                padding: 10,
                background: 'var(--card)',
              }}
            >
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Today</p>
              <p style={{ margin: '4px 0 0', color: '#ef4444', fontSize: 18, fontWeight: 700 }}>
                {metrics.followUpsToday}
              </p>
            </div>
            <div
              style={{
                border: '1px solid var(--card-border)',
                borderRadius: 10,
                padding: 10,
                background: 'var(--card)',
              }}
            >
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Overdue</p>
              <p style={{ margin: '4px 0 0', color: '#f59e0b', fontSize: 18, fontWeight: 700 }}>
                {metrics.followUpsOverdue}
              </p>
            </div>
            <div
              style={{
                border: '1px solid var(--card-border)',
                borderRadius: 10,
                padding: 10,
                background: 'var(--card)',
              }}
            >
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Unscheduled</p>
              <p style={{ margin: '4px 0 0', color: '#10b981', fontSize: 18, fontWeight: 700 }}>
                {metrics.followUpsUnscheduled}
              </p>
            </div>
          </div>

          {allEmpty ? (
            <p style={{ color: 'var(--muted)' }}>No follow-ups right now.</p>
          ) : (
            <div>
              {today.length > 0 && (
                <>
                  <SectionHeader label="Followups Today" color="#ef4444" />
                  <div style={{ display: 'grid', gap: 10 }}>
                    {today.map((item: any) => (
                      <FollowupCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}

              {overdue.length > 0 && (
                <>
                  <SectionHeader label="Overdue" color="#f59e0b" />
                  <div style={{ display: 'grid', gap: 10 }}>
                    {overdue.map((item: any) => (
                      <FollowupCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}

              {upcoming.length > 0 && (
                <>
                  <SectionHeader label="Upcoming" color="#2563eb" />
                  <div style={{ display: 'grid', gap: 10 }}>
                    {upcoming.map((item: any) => (
                      <FollowupCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}

              {unscheduled.length > 0 && (
                <>
                  <SectionHeader label="Unscheduled" color="#6b7280" />
                  <div style={{ display: 'grid', gap: 10 }}>
                    {unscheduled.map((item: any) => (
                      <FollowupCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
