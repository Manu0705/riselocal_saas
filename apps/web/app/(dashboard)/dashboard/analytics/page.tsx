'use client';

import { useDashboardData } from '@/context/DashboardDataContext';
import AnalyticsChart from '../components/analytics-chart';
import MobilePageTitle from '../components/mobile-page-title';

export default function AnalyticsPage() {
  const { metrics, loading, error } = useDashboardData();

  if (loading) return <p style={{ color: 'var(--muted)', padding: 16 }}>Loading analytics...</p>;
  if (error) return <p style={{ color: '#b91c1c', padding: 16 }}>Error: {error}</p>;

  return (
    <div style={{ padding: 16, color: 'var(--text)' }}>
      <MobilePageTitle title="Analytics" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 10,
          marginBottom: 12,
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
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Total Leads</p>
          <p style={{ margin: '4px 0 0', color: '#22c55e', fontWeight: 700, fontSize: 18 }}>
            {metrics.totalLeads}
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
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Conversion Rate</p>
          <p style={{ margin: '4px 0 0', color: '#2563eb', fontWeight: 700, fontSize: 18 }}>
            {metrics.conversionRate}%
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
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Converted</p>
          <p style={{ margin: '4px 0 0', color: '#f59e0b', fontWeight: 700, fontSize: 18 }}>
            {metrics.convertedLeads}
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
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Open / Followup</p>
          <p style={{ margin: '4px 0 0', color: '#10b981', fontWeight: 700, fontSize: 18 }}>
            {metrics.openLeads} / {metrics.followUpLeads}
          </p>
        </div>
      </div>

      <AnalyticsChart />
    </div>
  );
}
