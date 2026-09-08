'use client';

import Link from 'next/link';
import { useEffect, useState, type ComponentType } from 'react';
import {
  ArrowRight,
  Building2,
  LayoutTemplate,
  MonitorSmartphone,
  Palette,
  Shield,
  Sparkles,
  type LucideProps,
} from 'lucide-react';
import { adminApi } from '@/lib/api-client';
import { THEME_OPTIONS, getThemeLabel, type ThemeKey } from '@/lib/theme-options';
import type { TenantPublicPayload } from '@saas/domain-core/tenant.contract';

type Tenant = Pick<TenantPublicPayload, 'id' | 'name' | 'slug' | 'domain' | 'createdAt'> & {
  themeKey?: ThemeKey;
  theme?: ThemeKey;
};

type ThemeIcon = ComponentType<LucideProps>;

const themeIcons: Record<ThemeKey, ThemeIcon> = {
  default: LayoutTemplate,
  modern: MonitorSmartphone,
  business: Shield,
  minimal: Sparkles,
  hostel: Building2,
};

const themeAccents: Record<ThemeKey, { background: string; border: string; iconBg: string }> = {
  default: {
    background: '#eff6ff',
    border: '#bfdbfe',
    iconBg: '#dbeafe',
  },
  modern: {
    background: '#ecfeff',
    border: '#a5f3fc',
    iconBg: '#cffafe',
  },
  business: {
    background: '#ecfdf5',
    border: '#a7f3d0',
    iconBg: '#d1fae5',
  },
  minimal: {
    background: '#fdf2f8',
    border: '#fbcfe8',
    iconBg: '#fce7f3',
  },
  hostel: {
    background: '#f0fdf4',
    border: '#bbf7d0',
    iconBg: '#dcfce7',
  },
};

export default function ThemesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [draftThemes, setDraftThemes] = useState<Record<string, ThemeKey>>({});
  const [loading, setLoading] = useState(true);
  const [savingTenantId, setSavingTenantId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>('');

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const response = await adminApi.get('/tenants');
      const data = (Array.isArray(response) ? response : response?.data || []) as Tenant[];
      setTenants(data);
      setDraftThemes(
        Object.fromEntries(
          data.map((tenant) => [
            tenant.id,
            (tenant.theme || tenant.themeKey || 'default') as ThemeKey,
          ]),
        ),
      );
    } catch (error) {
      console.error('Failed to fetch tenants for theme management', error);
      setNotice('Could not load tenants right now.');
    } finally {
      setLoading(false);
    }
  }

  async function saveTheme(tenant: Tenant) {
    const themeKey = draftThemes[tenant.id] || 'default';
    setSavingTenantId(tenant.id);
    setNotice('');

    try {
      await adminApi.put(`/tenants/${tenant.id}`, {
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain || '',
        themeKey,
      });

      setTenants((current) =>
        current.map((item) => (item.id === tenant.id ? { ...item, themeKey } : item)),
      );
      setNotice(`${tenant.name} updated to ${getThemeLabel(themeKey)}.`);
    } catch (error) {
      console.error('Failed to update tenant theme', error);
      setNotice(`Failed to update theme for ${tenant.name}.`);
    } finally {
      setSavingTenantId(null);
    }
  }

  return (
    <div className="admin-container">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Theme Manager</h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: 760 }}>
            This is the missing left-menu theme area. Choose the public storefront theme for each tenant and control what customers see.
          </p>
        </div>

        <Link
          href="/dashboard/tenants"
          className="btn btn-primary"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          Open Tenant Settings
          <ArrowRight size={16} />
        </Link>
      </div>

      {notice ? (
        <div
          className="card"
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderColor: '#bfdbfe',
            background: '#eff6ff',
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1d4ed8' }}>{notice}</p>
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {THEME_OPTIONS.map((option) => {
          const Icon = themeIcons[option.value];
          const accent = themeAccents[option.value];

          return (
            <div
              key={option.value}
              className="card"
              style={{ background: accent.background, borderColor: accent.border, padding: 18 }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: accent.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Icon size={20} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{option.label}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                Best for: {option.bestFor}
              </p>
              <p style={{ fontSize: 14 }}>{option.description}</p>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Assign themes to tenants</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Update storefront themes directly from the admin sidebar flow.
            </p>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              background: '#f8fafc',
              border: '1px solid var(--card-border)',
            }}
          >
            <Palette size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{tenants.length} tenant(s)</span>
          </div>
        </div>

        {loading ? (
          <p>Loading theme manager...</p>
        ) : tenants.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No tenants found yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Slug</th>
                <th>Current Theme</th>
                <th>Change Theme</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => {
                const selectedTheme = draftThemes[tenant.id] || 'default';
                return (
                  <tr key={tenant.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: '#eff6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{tenant.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {tenant.domain || 'No custom domain'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code>{tenant.slug}</code>
                    </td>
                    <td>{getThemeLabel(tenant.theme || tenant.themeKey || 'default')}</td>
                    <td>
                      <select
                        className="input"
                        value={selectedTheme}
                        onChange={(event) =>
                          setDraftThemes((current) => ({
                            ...current,
                            [tenant.id]: event.target.value as ThemeKey,
                          }))
                        }
                      >
                        {THEME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        disabled={savingTenantId === tenant.id}
                        onClick={() => saveTheme(tenant)}
                      >
                        {savingTenantId === tenant.id ? 'Saving...' : 'Save Theme'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
