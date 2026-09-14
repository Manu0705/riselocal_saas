'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Users,
  Bell,
  Star,
  BedDouble,
  WalletCards,
} from 'lucide-react';
import { useDashboardData } from '@/context/DashboardDataContext';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    metrics,
    missedFollowUps,
    tenant,
    tenantSlug,
  } = useDashboardData();

  const [lastSeenTs, setLastSeenTs] = useState(0);

  const isHostelTheme =
    tenant?.theme?.trim().toLowerCase() === 'hostel';

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

    if (allTs.length === 0) {
      return 0;
    }

    return Math.max(...allTs);
  }, [metrics?.recentActivities, missedFollowUps]);

  const isOnNotificationsPage =
    pathname.startsWith('/dashboard/notifications');

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
    if (!isOnNotificationsPage) {
      return;
    }

    if (!latestNotificationTs) {
      return;
    }

    try {
      globalThis.localStorage.setItem(
        storageKey,
        String(latestNotificationTs),
      );

      setLastSeenTs(latestNotificationTs);
    } catch {
      // Ignore localStorage write failures.
    }
  }, [
    isOnNotificationsPage,
    latestNotificationTs,
    storageKey,
  ]);

  const hasUnseenNotifications =
    !isOnNotificationsPage &&
    latestNotificationTs > 0 &&
    latestNotificationTs > lastSeenTs;

  /*
   * Default dashboard quick navigation.
   */
  const defaultItems = [
    {
      label: 'Leads',
      icon: Users,
      path: '/dashboard/leads',
    },
    {
      label: 'Reviews',
      icon: Star,
      path: '/dashboard/reviews',
      primary: true,
    },
    {
      label: 'Notifications',
      icon: Bell,
      path: '/dashboard/notifications',
      badge: hasUnseenNotifications,
    },
  ];

  /*
   * Hostel quick navigation.
   *
   * These are intentionally icon-only because the full Hostel
   * navigation is available from the top-left Hostel menu.
   */
  const hostelItems = [
    {
      label: 'Students',
      icon: Users,
      path: '/dashboard/hostel/students',
    },
    {
      label: 'Rooms',
      icon: BedDouble,
      path: '/dashboard/hostel/rooms',
    },
    {
      label: 'Payments',
      icon: WalletCards,
      path: '/dashboard/hostel/payments',
    },
    {
      label: 'Notifications',
      icon: Bell,
      path: '/dashboard/notifications',
      badge: hasUnseenNotifications,
    },
  ];

  const items = isHostelTheme
    ? hostelItems
    : defaultItems;

  const getTenantQuery = () => {
    const tenant = searchParams.get('tenant');

    return tenant ? `?tenant=${tenant}` : '';
  };

  return (
    <>
      <div
        className="dashboard-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width:
            'min(calc(100% - (var(--app-edge) * 2)), var(--app-max-width))',
          height: 56,
          borderTop: '1px solid var(--card-border)',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          background: 'var(--card)',
          boxShadow: '0 -8px 22px var(--shadow)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
          paddingLeft: 12,
          paddingRight: 12,
          boxSizing: 'border-box',
          zIndex: 120,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.path ||
            (item.path !== '/dashboard/notifications' &&
              pathname.startsWith(`${item.path}/`));

          return (
            <button
              type="button"
              key={item.path}
              onClick={() =>
                router.push(item.path + getTenantQuery())
              }
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              style={{
                position: 'relative',
                border: 'none',
                background: active
                  ? 'var(--primary-soft, #eff6ff)'
                  : 'transparent',
                color: active
                  ? 'var(--primary, #2563eb)'
                  : 'var(--muted)',
                width: isHostelTheme ? 52 : undefined,
                height: isHostelTheme ? 44 : undefined,
                minWidth: isHostelTheme ? 52 : 72,
                borderRadius: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                gap: isHostelTheme ? 0 : 2,
                cursor: 'pointer',
                transition:
                  'background 140ms ease, color 140ms ease, transform 140ms ease',
              }}
            >
              <Icon
                size={
                  isHostelTheme
                    ? 22
                    : item.primary
                      ? 22
                      : 20
                }
                strokeWidth={active ? 2.4 : 2}
              />

              {!isHostelTheme && (
                <span
                  style={{
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {item.label}
                </span>
              )}

              {item.badge ? (
                <span
                  style={{
                    position: 'absolute',
                    top: isHostelTheme ? 5 : 0,
                    right: isHostelTheme ? 5 : 10,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: '#ef4444',
                    border: '2px solid var(--card)',
                    boxSizing: 'content-box',
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        /*
         * Bottom navigation is a tablet/mobile navigation layer.
         * Desktop uses the normal sidebar/menu instead.
         */
        .dashboard-bottom-nav {
          display: flex;
        }

        @media (min-width: 901px) {
          .dashboard-bottom-nav {
            display: none;
          }
        }
      `}</style>
    </>
  );
}