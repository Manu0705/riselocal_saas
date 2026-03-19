'use client';

import { useEffect, useState } from 'react';
import LeadsPreview from './components/leads-preview';
import AnalyticsSummary from './components/analytics-summary';
import AnalyticsChart from './components/analytics-chart';
import DashboardHomeSkeleton from './components/dashboard-home-skeleton';
import OnboardingChecklist from './components/onboarding-checklist';
import Card from '@/components/Card';
import PageErrorState from '@/components/page-error-state';
import { useDashboardData } from '@/context/DashboardDataContext';
import { useAuth } from '@/context/AuthContext';

function normalizeStatus(status?: string): string {
  return String(status ?? '')
    .trim()
    .toLowerCase();
}

export default function DashboardPage() {
  const { userName } = useAuth();
  const { leads, metrics, tenant, loading, error, refresh } = useDashboardData();
  const [showGreeting, setShowGreeting] = useState(true);

  useEffect(() => {
    const timeout = globalThis.setTimeout(() => {
      setShowGreeting(false);
    }, 4500);

    return () => globalThis.clearTimeout(timeout);
  }, []);

  const tenantServices = Array.isArray((tenant as { services?: unknown[] } | null)?.services)
    ? ((tenant as { services?: unknown[] }).services ?? []).length
    : 0;

  const totalServices = tenantServices;
  const engagedLeads = leads.filter((lead) => {
    const status = normalizeStatus(lead?.status);
    return status === 'converted' || status === 'contacted' || status === 'qualified';
  }).length;
  const convertedLeads = leads.filter((lead) => normalizeStatus(lead?.status) === 'converted').length;

  if (loading) {
    return <DashboardHomeSkeleton />;
  }

  if (error) {
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
        </header>
        <PageErrorState
          title="Dashboard data is unavailable"
          message={error}
          retryLabel="Reload dashboard"
          onRetry={refresh}
        />
      </div>
    );
  }

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
        {showGreeting ? (
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}>
            {userName ? `Welcome back, ${userName}!` : 'Welcome back!'} Here’s a quick snapshot of your business.
          </p>
        ) : null}
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <Card title="Total Services" value={totalServices} valueColor="#22c55e" />
        <Card title="Engaged Leads" value={engagedLeads} valueColor="#2563eb" />
        <Card title="Total Leads" value={metrics.totalLeads} valueColor="#f59e0b" />
        <Card title="Converted Leads" value={convertedLeads} valueColor="#10b981" />
      </div>

      <OnboardingChecklist />

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
