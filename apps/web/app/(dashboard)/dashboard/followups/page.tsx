'use client';

import { useMemo } from 'react';
import FollowupCard from '@/components/followup-card';
import { useDashboardData } from '@/context/DashboardDataContext';
import MobilePageTitle from '../components/mobile-page-title';

export default function FollowupsPage() {
  const { leads, metrics, loading, error } = useDashboardData();

  const followupItems = useMemo(
    () =>
      leads.filter((item) => {
        const status = String(item?.status ?? '')
          .trim()
          .toUpperCase();
        return status === 'QUALIFIED' || status === 'FOLLOW-UP' || status === 'FOLLOWUP';
      }),
    [leads],
  );

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
              <p style={{ margin: '4px 0 0', color: '#2563eb', fontSize: 18, fontWeight: 700 }}>
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

          {followupItems.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No follow-ups right now.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {followupItems.map((item: any) => (
                <FollowupCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
