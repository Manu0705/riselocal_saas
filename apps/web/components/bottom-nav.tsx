'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Users, Bell, Star } from 'lucide-react';
import { useDashboardData } from '@/context/DashboardDataContext';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { metrics, missedFollowUps, tenant, tenantSlug } = useDashboardData();

  const [lastSeenTs, setLastSeenTs] = useState(0);

  const tenantKey =
    tenantSlug ??
    tenant?.slug ??
    tenant?.domain ??
    tenant?.id ??
    searchParams.get('tenant') ??
    'default';
  const storageKey = `notifications:lastSeen:${tenantKey}`;

  const latestNotificationTs = useMemo(() => {
    const activityTs = (metrics?.recentActivities ?? [])
      .map((item) => new Date(String(item?.timestamp ?? '')).getTime())
      .filter((ts) => Number.isFinite(ts));

    const missedTs = (missedFollowUps ?? [])
      .map((item) => new Date(String(item?.followUpAt ?? '')).getTime())
      .filter((ts) => Number.isFinite(ts));

    const allTs = [...activityTs, ...missedTs];
    if (allTs.length === 0) return 0;
    return Math.max(...allTs);
  }, [metrics?.recentActivities, missedFollowUps]);

  const isOnNotificationsPage = pathname.startsWith('/dashboard/notifications');

  useEffect(() => {
    try {
      const raw = globalThis.localStorage.getItem(storageKey);
      const parsed = raw ? Number(raw) : 0;
      setLastSeenTs(Number.isFinite(parsed) ? parsed : 0);
    } catch {
      setLastSeenTs(0);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isOnNotificationsPage) return;
    if (!latestNotificationTs) return;

    try {
      globalThis.localStorage.setItem(storageKey, String(latestNotificationTs));
      setLastSeenTs(latestNotificationTs);
    } catch {
      // Ignore localStorage write failures.
    }
  }, [isOnNotificationsPage, latestNotificationTs, storageKey]);

  const hasUnseenNotifications =
    !isOnNotificationsPage && latestNotificationTs > 0 && latestNotificationTs > lastSeenTs;

  const items = [
    { label: 'Leads', icon: Users, path: '/dashboard/leads' },
    { label: 'Reviews', icon: Star, path: '/dashboard/reviews', primary: true },
    {
      label: 'Notifications',
      icon: Bell,
      path: '/dashboard/notifications',
      badge: hasUnseenNotifications,
    },
  ];

  const getTenantQuery = () => {
    const tenant = searchParams.get('tenant');
    return tenant ? `?tenant=${tenant}` : '';
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(calc(100% - (var(--app-edge) * 2)), var(--app-max-width))',
        height: 56,
        borderTop: '1px solid var(--card-border)',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        background: 'var(--card)',
        boxShadow: '0 -8px 22px var(--shadow)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
        paddingLeft: 16,
        paddingRight: 16,
        boxSizing: 'border-box',
        zIndex: 120,
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.path;

        return (
          <button
            type="button"
            key={item.path}
            onClick={() => router.push(item.path + getTenantQuery())}
            style={{
              border: 'none',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: 12,
              color: active ? 'var(--text)' : 'var(--muted)',
              position: 'relative',
              gap: 2,
              transform: item.primary ? 'translate(10px, -14px)' : 'none',
            }}
            aria-label={item.label}
          >
            {item.primary ? (
              <span
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 12px 24px rgba(37,99,235,0.35)',
                  transition: 'transform 140ms ease',
                }}
              >
                <Icon size={22} />
              </span>
            ) : (
              <Icon size={20} />
            )}
            <span style={{ fontWeight: active ? 700 : 500 }}>{item.label}</span>
            {item.badge ? (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: '#ef4444',
                }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
