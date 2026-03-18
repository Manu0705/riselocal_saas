'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDashboardData } from '@/context/DashboardDataContext';
import AnalyticsChart from '../components/analytics-chart';
import MobilePageTitle from '../components/mobile-page-title';
import { api } from '@/lib/api-client';

export default function AnalyticsPage() {
  const { metrics, loading, error, tenant, tenantSlug } = useDashboardData();
  const [partition, setPartition] = useState<'week' | 'month' | 'quarter' | 'year'>('week');
  const [partitionData, setPartitionData] = useState<any>(null);

  const tenantRouteKey = useMemo(() => tenantSlug || tenant?.slug || tenant?.id || '', [tenantSlug, tenant]);

  useEffect(() => {
    if (!tenantRouteKey) return;

    api
      .get(`/tenant/${tenantRouteKey}/leads/analytics?partition=${partition}`)
      .then((response: any) => {
        if (response?.success && response?.data) {
          setPartitionData(response.data);
        }
      })
      .catch(() => {
        setPartitionData(null);
      });
  }, [partition, tenantRouteKey]);

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
        <div
          style={{
            border: '1px solid var(--card-border)',
            borderRadius: 10,
            padding: 10,
            background: 'var(--card)',
          }}
        >
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Avg Time To Convert</p>
          <p style={{ margin: '4px 0 0', color: '#ea580c', fontWeight: 700, fontSize: 18 }}>
            {metrics.avgTimeToConvert}h
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
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Session To Conversion</p>
          <p style={{ margin: '4px 0 0', color: '#0891b2', fontWeight: 700, fontSize: 18 }}>
            {metrics.sessionToConversionRatio}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {(['week', 'month', 'quarter', 'year'] as const).map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setPartition(item)}
            style={{
              border: '1px solid var(--card-border)',
              borderRadius: 999,
              padding: '6px 10px',
              background: partition === item ? '#111827' : 'var(--card)',
              color: partition === item ? '#fff' : 'var(--text)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {item === 'week' && 'This Week'}
            {item === 'month' && 'This Month'}
            {item === 'quarter' && 'Quarterly'}
            {item === 'year' && 'Yearly'}
          </button>
        ))}
      </div>

      <div
        style={{
          border: '1px solid var(--card-border)',
          borderRadius: 10,
          padding: 10,
          background: 'var(--card)',
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>
          Conversion Rate By Source
        </p>
        {(partitionData?.derived?.conversion_rate_by_source || metrics.conversionRateBySource).length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>No source data yet.</p>
        ) : (
          (partitionData?.derived?.conversion_rate_by_source || metrics.conversionRateBySource).map(
            (item: any) => (
              <p key={item.source} style={{ margin: '3px 0', color: 'var(--text)', fontSize: 12 }}>
                {item.source}: {item.converted}/{item.total} ({item.conversion_rate}%)
              </p>
            ),
          )
        )}
      </div>

      <div
        style={{
          border: '1px solid var(--card-border)',
          borderRadius: 10,
          padding: 10,
          background: 'var(--card)',
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>
          Leads Per Agent
        </p>
        {metrics.leadsPerAgent.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>No assignment data yet.</p>
        ) : (
          metrics.leadsPerAgent.map((agent) => (
            <p key={`${agent.assignedTo || 'unassigned'}-${agent.agentName}`} style={{ margin: '3px 0', color: 'var(--text)', fontSize: 12 }}>
              {agent.agentName}: {agent.leadCount}
            </p>
          ))
        )}
      </div>

      <div
        style={{
          border: '1px solid var(--card-border)',
          borderRadius: 10,
          padding: 10,
          background: 'var(--card)',
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>
          Recent Activities (Last 50)
        </p>
        {metrics.recentActivities.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>No activity records yet.</p>
        ) : (
          metrics.recentActivities.slice(0, 50).map((entry) => (
            <p key={entry.id} style={{ margin: '3px 0', color: 'var(--text)', fontSize: 12 }}>
              {entry.leadName}: {entry.type} ({new Date(entry.timestamp).toLocaleString()})
            </p>
          ))
        )}
      </div>

      <AnalyticsChart />
    </div>
  );
}
