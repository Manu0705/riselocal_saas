'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/context/DashboardDataContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Moon, Sun, Menu } from 'lucide-react';
import {
  getHostelNavigation,
  type HostelNavItem,
} from '@/lib/hostel-navigation';

const MOBILE_BREAKPOINT = 900;

export default function DashboardHeader() {
  const { logout, tenantSlug: storedTenantSlug, userRole } = useAuth();
  const { tenant } = useDashboardData();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /*
   * A tenant using the Hostel theme should get Hostel navigation
   * even when they are currently on /dashboard.
   *
   * Direct Hostel routes are also treated as Hostel routes so
   * existing /dashboard/hostel/* URLs continue to work.
   */
  const isHostelTheme =
    tenant?.theme?.trim().toLowerCase() === 'hostel';

  const isHostelRoute = pathname.startsWith('/dashboard/hostel');

  const isHostelDashboard = isHostelTheme || isHostelRoute;

  /*
   * Hostel navigation comes from the existing RBAC source of truth.
   *
   * Students, Rooms and Payments are already represented in the
   * mobile/tablet BottomNav, so they are intentionally excluded
   * from this dropdown to avoid duplicate navigation.
   */
  const hostelNavigation = useMemo<readonly HostelNavItem[]>(() => {
    if (!isHostelDashboard) return [];

    const navigation = getHostelNavigation(userRole);

    const quickNavigationPaths = new Set([
      '/dashboard/hostel/students',
      '/dashboard/hostel/rooms',
      '/dashboard/hostel/payments',
    ]);

    return navigation.filter((item) => {
      if (quickNavigationPaths.has(item.href)) {
        return false;
      }

      if (pathname === '/dashboard' && item.href === '/dashboard/hostel') {
        return false;
      }

      return !(
        pathname === item.href ||
        pathname.startsWith(`${item.href}/`)
      );
    });
  }, [isHostelDashboard, userRole, pathname]);

  useEffect(() => {
    const theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
  }, [dark]);

  /*
   * Close the menu when clicking outside.
   */
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen]);

  /*
   * Hostel mobile/tablet navigation uses the same dropdown
   * interaction as the normal dashboard.
   *
   * When switching to desktop, close the dropdown because the
   * Hostel sidebar becomes the navigation source.
   */
  useEffect(() => {
    if (!isHostelDashboard) return;

    const handleResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setMenuOpen(false);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isHostelDashboard]);

  /*
   * Escape closes the mobile/tablet dropdown.
   */
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  function toggle() {
    setDark((prev) => !prev);
  }

  /*
   * Default dashboard and Hostel dashboard both use the same
   * top-left menu button on mobile/tablet.
   *
   * For Hostel desktop, the button does nothing because the
   * permanent Hostel sidebar is already visible.
   */
  const handleMenuClick = () => {
    if (isHostelDashboard) {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        setMenuOpen((prev) => !prev);
      }

      return;
    }

    setMenuOpen((prev) => !prev);
  };

  const goToSettings = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? '?tenant=' + tenantQuery : '';

    router.push('/dashboard/settings' + query);
    setMenuOpen(false);
  };

  const goToCustomize = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? '?tenant=' + tenantQuery : '';

    router.push('/dashboard/customize' + query);
    setMenuOpen(false);
  };

  const goToAnalytics = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? '?tenant=' + tenantQuery : '';

    router.push('/dashboard/analytics' + query);
    setMenuOpen(false);
  };

  const goToHostel = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? '?tenant=' + tenantQuery : '';

    router.push('/dashboard/hostel' + query);
    setMenuOpen(false);
  };

  const goToLeadView = () => {
    const tenantRouteKey =
      searchParams.get('tenant') ??
      tenant?.slug ??
      tenant?.domain ??
      tenant?.id ??
      storedTenantSlug ??
      'default';

    router.push(`/${tenantRouteKey}?view=public`, {
      scroll: false,
    });

    setMenuOpen(false);
  };

  const goHome = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? `?tenant=${tenantQuery}` : '';

    router.push(`/dashboard${query}`);
    setMenuOpen(false);
  };

  const goToHelp = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? `?tenant=${tenantQuery}` : '';

    router.push(`/dashboard/help${query}`);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();

    const tenantQuery = searchParams.get('tenant');

    if (tenantQuery) {
      router.push(`/${tenantQuery}`);
    } else {
      router.push('/default');
    }

    setMenuOpen(false);
  };

  /*
   * Determine which section is currently active.
   */
  const currentMenuKey = (() => {
    if (isHostelDashboard) return 'hostel';

    if (pathname === '/dashboard') return 'home';
    if (pathname.startsWith('/dashboard/customize')) return 'customize';
    if (pathname.startsWith('/dashboard/analytics')) return 'analytics';
    if (pathname.startsWith('/dashboard/hostel')) return 'hostel';
    if (pathname.startsWith('/dashboard/settings')) return 'settings';
    if (pathname.startsWith('/dashboard/help')) return 'help';

    return null;
  })();

  const menuItems = [
    {
      key: 'home',
      label: 'Home',
      onPress: goHome,
    },
    {
      key: 'lead-view',
      label: 'Lead View',
      onPress: goToLeadView,
    },
    {
      key: 'customize',
      label: 'Customize',
      onPress: goToCustomize,
    },
    {
      key: 'analytics',
      label: 'Analytics',
      onPress: goToAnalytics,
    },
    {
      key: 'hostel',
      label: 'Hostel',
      onPress: goToHostel,
    },
    {
      key: 'settings',
      label: 'Settings',
      onPress: goToSettings,
    },
    {
      key: 'help',
      label: 'Help',
      onPress: goToHelp,
    },
    {
      key: 'logout',
      label: 'Logout',
      onPress: handleLogout,
    },
  ].filter(
    (item) => item.key === 'logout' || item.key !== currentMenuKey,
  );

  /*
   * Prefetch the public tenant page for the Lead View action.
   */
  useEffect(() => {
    const tenantRouteKey =
      searchParams.get('tenant') ??
      tenant?.slug ??
      tenant?.domain ??
      tenant?.id ??
      storedTenantSlug ??
      'default';

    router.prefetch(`/${tenantRouteKey}?view=public`);
  }, [
    router,
    searchParams,
    tenant?.slug,
    tenant?.domain,
    tenant?.id,
    storedTenantSlug,
  ]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 'clamp(56px, 6vw, 64px)',
          padding: '0 clamp(12px, 2vw, 20px)',
          borderBottom: '1px solid var(--card-border)',
          fontWeight: 600,
          fontSize: 16,
          background: 'var(--card)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 10px var(--shadow)',
        }}
      >
        <div
          ref={menuRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            position: 'relative',
            minWidth: 0,
          }}
        >
          <button
            type="button"
            onClick={handleMenuClick}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 10,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              marginLeft: -10,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label={
              isHostelDashboard
                ? 'Open hostel navigation'
                : 'Open menu'
            }
            aria-expanded={menuOpen}
            aria-controls={
              isHostelDashboard
                ? 'hostel-mobile-navigation'
                : 'dashboard-navigation'
            }
          >
            <Menu size={18} />
          </button>

          <span
            style={{
              fontWeight: 700,
              fontSize: 'clamp(18px, 2.2vw, 24px)',
              color: 'var(--text)',
              letterSpacing: '-0.4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isHostelDashboard ? 'Hostel' : 'Dashboard'}
          </span>

          {/* Normal Dashboard Menu Dropdown */}
          {!isHostelDashboard && (
            <div
              id="dashboard-navigation"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: 180,
                borderRadius: 12,
                border: '1px solid var(--card-border)',
                background: 'var(--card)',
                boxShadow: '0 14px 30px var(--shadow)',
                padding: 8,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen
                  ? 'translateY(0)'
                  : 'translateY(-6px)',
                pointerEvents: menuOpen ? 'auto' : 'none',
                transition:
                  'opacity 160ms ease, transform 160ms ease',
                zIndex: 200,
              }}
            >
              {menuItems.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={item.onPress}
                  style={{
                    width: '100%',
                    border: 'none',
                    borderRadius: 10,
                    background: 'transparent',
                    color:
                      item.label === 'Logout'
                        ? '#dc2626'
                        : 'var(--text)',
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Hostel Mobile / Tablet Dropdown */}
          {isHostelDashboard && (
            <div
              id="hostel-mobile-navigation"
              className="hostel-mobile-navigation"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: 'min(260px, calc(100vw - 24px))',
                maxHeight: 'min(70vh, 520px)',
                overflowY: 'auto',
                borderRadius: 12,
                border: '1px solid var(--card-border)',
                background: 'var(--card)',
                boxShadow: '0 14px 30px var(--shadow)',
                padding: 8,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen
                  ? 'translateY(0)'
                  : 'translateY(-6px)',
                pointerEvents: menuOpen ? 'auto' : 'none',
                transition:
                  'opacity 160ms ease, transform 160ms ease',
                zIndex: 200,
              }}
            >
              {hostelNavigation.map((item) => {
                const tenantQuery = searchParams.get('tenant');
                const query = tenantQuery
                  ? `?tenant=${tenantQuery}`
                  : '';

                const href = `${item.href}${query}`;

                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <button
                    type="button"
                    key={item.href}
                    onClick={() => {
                      router.push(href);
                      setMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: 10,
                      background: isActive
                        ? 'var(--primary-soft)'
                        : 'transparent',
                      color: 'var(--text)',
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'background 140ms ease',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: 10,
                  background: 'transparent',
                  color: '#dc2626',
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginTop: 4,
                  borderTop: '1px solid var(--card-border)',
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={toggle}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 10,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <style jsx>{`
        .hostel-mobile-navigation {
          display: block;
        }

        @media (min-width: ${MOBILE_BREAKPOINT + 1}px) {
          .hostel-mobile-navigation {
            display: none;
          }
        }
      `}</style>
    </>
  );
}