'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Target, Activity } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

type TenantStats = {
  tenantId: string;
  tenantName: string;
  totalLeads: number;
  openLeads: number;
  followUpLeads: number;
  convertedLeads: number;
  conversionRate: number;
};

export default function AnalyticsPage() {
  const [tenantStats, setTenantStats] = useState<TenantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalLeads: 0,
    totalConverted: 0,
    avgConversionRate: 0,
    activeTenants: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const tenantsResponse = await adminApi.get('/tenants');
      const tenants = Array.isArray(tenantsResponse)
        ? tenantsResponse
        : tenantsResponse?.data || [];

      const stats: TenantStats[] = [];
      let totalLeads = 0;
      let totalConverted = 0;

      await Promise.all(
        tenants.map(async (tenant: any) => {
          try {
            const leadsResponse = await adminApi.get(`/tenants/${tenant.id}/leads`);
            const leads = Array.isArray(leadsResponse) ? leadsResponse : leadsResponse?.data || [];

            const openLeads = leads.filter((l: any) => l.status === 'Open').length;
            const followUpLeads = leads.filter((l: any) => l.status === 'Follow-Up').length;
            const convertedLeads = leads.filter((l: any) => l.status === 'Converted').length;
            const conversionRate =
              leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

            stats.push({
              tenantId: tenant.id,
              tenantName: tenant.name,
              totalLeads: leads.length,
              openLeads,
              followUpLeads,
              convertedLeads,
              conversionRate,
            });

            totalLeads += leads.length;
            totalConverted += convertedLeads;
          } catch (err) {
            console.error(`Error fetching leads for ${tenant.name}:`, err);
          }
        }),
      );

      stats.sort((a, b) => b.totalLeads - a.totalLeads);
      setTenantStats(stats);

      const avgConversionRate =
        stats.length > 0
          ? Math.round(stats.reduce((sum, s) => sum + s.conversionRate, 0) / stats.length)
          : 0;

      setGlobalStats({
        totalLeads,
        totalConverted,
        avgConversionRate,
        activeTenants: tenants.length,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-container">
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Analytics & Insights</h1>
        <p style={{ color: 'var(--text-muted)' }}>Performance metrics across all tenants</p>
      </div>

      {/* Global Stats */}
      <div className="stats-grid" style={{ marginBottom: 40 }}>
        <div className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Active Tenants</span>
            <Users size={20} color="#3b82f6" />
          </div>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{globalStats.activeTenants}</p>
        </div>

        <div className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Leads</span>
            <Activity size={20} color="#10b981" />
          </div>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{globalStats.totalLeads}</p>
        </div>

        <div className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Conversions</span>
            <Target size={20} color="#f59e0b" />
          </div>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{globalStats.totalConverted}</p>
        </div>

        <div className="stat-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Avg. Conversion Rate</span>
            <TrendingUp size={20} color="#ef4444" />
          </div>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{globalStats.avgConversionRate}%</p>
        </div>
      </div>

      {/* Tenant Performance Table */}
      <div className="card">
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Tenant Performance</h2>

        {tenantStats.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            No analytics data available yet
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Total Leads</th>
                <th>Open</th>
                <th>Follow-Up</th>
                <th>Converted</th>
                <th>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {tenantStats.map((stat) => (
                <tr key={stat.tenantId}>
                  <td style={{ fontWeight: 600 }}>{stat.tenantName}</td>
                  <td>{stat.totalLeads}</td>
                  <td>
                    <span className="badge" style={{ background: '#3b82f6' }}>
                      {stat.openLeads}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: '#f59e0b' }}>
                      {stat.followUpLeads}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: '#10b981' }}>
                      {stat.convertedLeads}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          background: '#e5e7eb',
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${stat.conversionRate}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 600, minWidth: 40 }}>{stat.conversionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
