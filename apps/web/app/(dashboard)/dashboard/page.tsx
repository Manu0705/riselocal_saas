'use client';

import LeadsPreview from './components/leads-preview';
import AnalyticsSummary from './components/analytics-summary';
import AnalyticsChart from './components/analytics-chart';
import Card from '@/components/Card';
import { useDashboardData } from '@/context/DashboardDataContext';

function formatCurrency(value: number): string {
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

function normalizeStatus(status?: string): string {
  return String(status ?? '')
    .trim()
    .toLowerCase();
}

export default function DashboardPage() {
  const { leads, metrics, tenant, loading } = useDashboardData();

  const tenantServices = Array.isArray((tenant as { services?: unknown[] } | null)?.services)
    ? ((tenant as { services?: unknown[] }).services ?? []).length
    : 0;

  const totalMenus = tenantServices > 0 ? tenantServices : metrics.totalLeads;
  const totalOrders = leads.filter((lead) => {
    const status = normalizeStatus(lead?.status);
    return status === 'converted' || status === 'contacted' || status === 'qualified';
  }).length;
  const uniqueClients = new Set(
    leads.map((lead) => String(lead?.phone ?? '').trim()).filter(Boolean),
  ).size;
  const estimatedRevenue = totalOrders * 2750;

  const cardValue = (value: string | number): string | number => (loading ? '--' : value);

  return (
    <div style={{ padding: 16 }}>
      <header style={{ marginBottom: 24 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '-0.4px',
          }}
        >
          Home
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}>
          Welcome back! Here’s a quick snapshot of your business.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <Card title="Total Menus" value={cardValue(totalMenus)} valueColor="#22c55e" />
        <Card title="Total Orders" value={cardValue(totalOrders)} valueColor="#2563eb" />
        <Card title="Total Clients" value={cardValue(uniqueClients)} valueColor="#f59e0b" />
        <Card
          title="Total Revenue"
          value={cardValue(formatCurrency(estimatedRevenue))}
          valueColor="#10b981"
        />
      </div>

      <div style={{ marginTop: 22 }}>
        <AnalyticsSummary />
        <AnalyticsChart />
      </div>

      <div style={{ marginTop: 22 }}>
        <LeadsPreview />
      </div>
    </div>
  );
}
