'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, RefreshCw } from 'lucide-react';
import PageErrorState from '@/components/page-error-state';
import { getTenantApiClient } from '@/lib/tenant-client';
import {
  getDashboardRefreshEventName,
  getDashboardRefreshStorageKey,
  parseDashboardRefreshPayload,
} from '@/lib/dashboard-events';

type ChecklistItem = {
  id: string;
  title: string;
  hint: string;
  done: boolean;
};

type TenantSettingsPayload = {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  businessPhone?: string;
  businessWhatsApp?: string;
  actionButtons?: Record<string, { enabled?: boolean; phone?: string }>;
};

function getBoolean(value: unknown): boolean {
  return Boolean(value);
}

export default function OnboardingChecklist() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);

  const loadChecklist = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const api = getTenantApiClient();
      const [settingsResponse, servicesResponse, galleryResponse, socialResponse] = await Promise.all([
        api.get('/settings'),
        api.get('/services'),
        api.get('/gallery'),
        api.get('/social'),
      ]);

      const settings = (settingsResponse?.data ?? {}) as TenantSettingsPayload;
      const services = Array.isArray(servicesResponse?.data) ? servicesResponse.data : [];
      const gallery = Array.isArray(galleryResponse?.data) ? galleryResponse.data : [];
      const social = Array.isArray(socialResponse?.data) ? socialResponse.data : [];

      const actionButtons = settings.actionButtons ?? {};
      const hasConfiguredActionButton = Object.values(actionButtons).some((entry) => {
        if (!entry || typeof entry !== 'object') return false;
        return getBoolean(entry.enabled) && String(entry.phone ?? '').trim().length > 0;
      });

      setItems([
        {
          id: 'branding',
          title: 'Branding is set',
          hint: 'Upload logo and banner, then set primary color.',
          done: Boolean(settings.logoUrl && settings.bannerUrl && settings.primaryColor),
        },
        {
          id: 'contact',
          title: 'Contact channels are set',
          hint: 'Add business phone and WhatsApp in Branding.',
          done: Boolean(settings.businessPhone && settings.businessWhatsApp),
        },
        {
          id: 'services',
          title: 'Service catalog added',
          hint: 'Add at least 3 services so visitors can choose confidently.',
          done: services.length >= 3,
        },
        {
          id: 'gallery',
          title: 'Gallery is populated',
          hint: 'Upload at least 4 images in Gallery with categories.',
          done: gallery.length >= 4,
        },
        {
          id: 'social',
          title: 'Trust links added',
          hint: 'Add at least 1 social/profile link for credibility.',
          done: social.length >= 1,
        },
        {
          id: 'cta',
          title: 'Action buttons configured',
          hint: 'Enable at least one action button with a phone number.',
          done: hasConfiguredActionButton,
        },
      ]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load onboarding checklist');
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadChecklist();
  }, [loadChecklist]);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const eventName = getDashboardRefreshEventName();
    const storageKey = getDashboardRefreshStorageKey();

    const intervalId = globalThis.setInterval(() => {
      void loadChecklist({ silent: true });
    }, 60 * 1000);

    const onDashboardRefresh = () => {
      void loadChecklist({ silent: true });
    };

    const onStorageRefresh = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const payload = parseDashboardRefreshPayload(event.newValue);
      if (!payload) return;
      void loadChecklist({ silent: true });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadChecklist({ silent: true });
      }
    };

    globalThis.window.addEventListener(eventName, onDashboardRefresh as EventListener);
    globalThis.window.addEventListener('storage', onStorageRefresh);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      globalThis.clearInterval(intervalId);
      globalThis.window.removeEventListener(eventName, onDashboardRefresh as EventListener);
      globalThis.window.removeEventListener('storage', onStorageRefresh);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadChecklist]);

  const completedCount = useMemo(() => items.filter((item) => item.done).length, [items]);
  const total = items.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  if (loading) {
    return (
      <div
        style={{
          marginTop: 22,
          border: '1px solid var(--card-border)',
          borderRadius: 12,
          background: 'var(--card)',
          padding: 16,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Tenant Launch Checklist</div>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--muted)' }} />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            style={{
              height: 42,
              borderRadius: 10,
              background: '#e5e7eb',
              animation: 'pulse 1.4s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: 22 }}>
        <PageErrorState
          title="Tenant checklist is unavailable"
          message={error}
          retryLabel="Retry checklist"
          onRetry={() => {
            void loadChecklist();
          }}
        />
      </div>
    );
  }

  if (total > 0 && completedCount === total) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: 22,
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        background: 'var(--card)',
        padding: 16,
        boxShadow: '0 4px 12px var(--shadow)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Tenant Launch Checklist</h3>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            {completedCount}/{total} completed ({progress}%)
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadChecklist();
          }}
          style={{
            border: '1px solid var(--card-border)',
            background: 'transparent',
            borderRadius: 10,
            padding: '8px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div
        style={{
          marginTop: 12,
          width: '100%',
          height: 8,
          borderRadius: 999,
          background: 'var(--card-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: progress === 100 ? '#16a34a' : '#2563eb',
            transition: 'width 220ms ease',
          }}
        />
      </div>

      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid var(--card-border)',
              borderRadius: 10,
              padding: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              background: item.done ? 'rgba(22, 163, 74, 0.08)' : 'var(--card)',
            }}
          >
            {item.done ? (
              <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <Circle size={18} color="#9ca3af" style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.title}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)' }}>{item.hint}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}