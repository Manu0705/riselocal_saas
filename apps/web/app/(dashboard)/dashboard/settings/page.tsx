'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/context/DashboardDataContext';
import MobilePageTitle from '../components/mobile-page-title';
import { getTenantApiClient } from '@/lib/tenant-client';
import { Loader2, Save } from 'lucide-react';

type LeadLifecycleSettings = {
  convertedKeepDays: number;
  lostKeepDays: number;
  missedFollowupNotifyDays: number;
};

const DEFAULT_LEAD_LIFECYCLE: LeadLifecycleSettings = {
  convertedKeepDays: 14,
  lostKeepDays: 21,
  missedFollowupNotifyDays: 7,
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return Math.round(value);
}

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const { tenant, metrics, loading, error } = useDashboardData();
  const [lifecycle, setLifecycle] = useState<LeadLifecycleSettings>(DEFAULT_LEAD_LIFECYCLE);
  const [savingLifecycle, setSavingLifecycle] = useState(false);
  const [lifecycleStatus, setLifecycleStatus] = useState<string | null>(null);

  useEffect(() => {
    void loadLifecycleSettings();
  }, []);

  const loadLifecycleSettings = async () => {
    try {
      const api = getTenantApiClient();
      const response = await api.get('/settings');
      const raw = (response?.data?.leadLifecycle || {}) as Partial<LeadLifecycleSettings>;

      setLifecycle({
        convertedKeepDays: clamp(Number(raw.convertedKeepDays ?? DEFAULT_LEAD_LIFECYCLE.convertedKeepDays), 1, 60),
        lostKeepDays: clamp(Number(raw.lostKeepDays ?? DEFAULT_LEAD_LIFECYCLE.lostKeepDays), 1, 90),
        missedFollowupNotifyDays: clamp(
          Number(raw.missedFollowupNotifyDays ?? DEFAULT_LEAD_LIFECYCLE.missedFollowupNotifyDays),
          1,
          14,
        ),
      });
    } catch {
      setLifecycle(DEFAULT_LEAD_LIFECYCLE);
    }
  };

  const handleLifecycleChange = (field: keyof LeadLifecycleSettings, value: number) => {
    const bounds: Record<keyof LeadLifecycleSettings, [number, number]> = {
      convertedKeepDays: [1, 60],
      lostKeepDays: [1, 90],
      missedFollowupNotifyDays: [1, 14],
    };
    const [min, max] = bounds[field];

    setLifecycle((prev) => ({
      ...prev,
      [field]: clamp(value, min, max),
    }));
  };

  const saveLifecycleSettings = async () => {
    setSavingLifecycle(true);
    setLifecycleStatus(null);

    try {
      const api = getTenantApiClient();
      await api.put('/settings', {
        leadLifecycle: lifecycle,
      });
      setLifecycleStatus('Lead lifecycle settings saved.');
    } catch (err) {
      setLifecycleStatus(err instanceof Error ? err.message : 'Failed to save lead lifecycle settings.');
    } finally {
      setSavingLifecycle(false);
    }
  };

  const tenantSlug = tenant?.slug ?? 'N/A';
  const publicUrl = tenant?.slug ? `https://riselocal.in/${tenant.slug}` : 'N/A';
  const loginUrl = tenant?.slug ? `https://riselocal.in/login?tenant=${tenant.slug}` : 'N/A';
  const joinedAt = tenant?.createdAt
    ? new Date(tenant.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const handleLogout = () => {
    logout();
    const tenantRouteKey = tenant?.slug ?? tenant?.id ?? 'default';
    router.push(`/${tenantRouteKey}`);
  };

  return (
    <div style={{ padding: 16 }}>
      <MobilePageTitle title="Settings" />

      {loading ? <p style={{ color: 'var(--muted)' }}>Loading account data...</p> : null}
      {error ? <p style={{ color: '#b91c1c' }}>Error: {error}</p> : null}

      {!loading && !error ? (
        <>
          <div
            style={{
              border: '1px solid var(--card-border)',
              background: 'var(--card)',
              borderRadius: 10,
              padding: 14,
              marginBottom: 12,
              display: 'grid',
              gap: 8,
            }}
          >
            <p style={{ margin: 0, color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>
              Account Overview
            </p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Business: {tenant?.name ?? 'N/A'}</p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Tenant ID: {tenant?.id ?? 'N/A'}</p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Public URL: {publicUrl}</p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Login URL: {loginUrl}</p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Slug: {tenantSlug}</p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Joined: {joinedAt}</p>
          </div>

          <div
            style={{
              border: '1px solid var(--card-border)',
              background: 'var(--card)',
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
              display: 'grid',
              gap: 8,
            }}
          >
            <p style={{ margin: 0, color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>
              Lead Health
            </p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Total Leads: {metrics.totalLeads}</p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Converted Leads: {metrics.convertedLeads}
            </p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Follow-Ups: {metrics.followUpLeads}</p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Open Leads: {metrics.openLeads}</p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Conversion Rate: {metrics.conversionRate}%
            </p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Recent Lead: {metrics.recentLeadName}
            </p>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Recent Lead Date: {metrics.recentLeadDate}
            </p>
          </div>

          <div
            style={{
              border: '1px solid var(--card-border)',
              background: 'var(--card)',
              borderRadius: 10,
              padding: 14,
              marginBottom: 16,
              display: 'grid',
              gap: 12,
            }}
          >
            <p style={{ margin: 0, color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>
              Lead Lifecycle
            </p>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
              Keep dashboard clean without deleting DB records.
            </p>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                Converted leads stay visible (days)
              </span>
              <input
                type="number"
                min={1}
                max={60}
                value={lifecycle.convertedKeepDays}
                onChange={(event) => handleLifecycleChange('convertedKeepDays', Number(event.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  background: 'var(--background)',
                  color: 'var(--text)',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                Lost leads stay visible at bottom (days)
              </span>
              <input
                type="number"
                min={1}
                max={90}
                value={lifecycle.lostKeepDays}
                onChange={(event) => handleLifecycleChange('lostKeepDays', Number(event.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  background: 'var(--background)',
                  color: 'var(--text)',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                Missed follow-up notification window (days)
              </span>
              <input
                type="number"
                min={1}
                max={14}
                value={lifecycle.missedFollowupNotifyDays}
                onChange={(event) =>
                  handleLifecycleChange('missedFollowupNotifyDays', Number(event.target.value))
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--card-border)',
                  borderRadius: 8,
                  background: 'var(--background)',
                  color: 'var(--text)',
                }}
              />
            </label>

            <button
              type="button"
              onClick={saveLifecycleSettings}
              disabled={savingLifecycle}
              style={{
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 14,
                fontWeight: 700,
                cursor: savingLifecycle ? 'not-allowed' : 'pointer',
                opacity: savingLifecycle ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {savingLifecycle ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Save size={16} />
              )}
              {savingLifecycle ? 'Saving...' : 'Save Lifecycle Rules'}
            </button>

            {lifecycleStatus ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{lifecycleStatus}</p>
            ) : null}
          </div>
        </>
      ) : null}

      <button
        type="button"
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: 16,
          borderRadius: 10,
          border: 'none',
          background: '#dc2626',
          color: '#fff',
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  );
}
