'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/context/DashboardDataContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Moon, Sun, Menu, UserRound, ChevronDown } from 'lucide-react';
import { useHostelSidebarState } from './hostel-sidebar-state';
import HostelWorkspaceNavigation from '../hostel/components/hostel-workspace-navigation';

const DESKTOP_BREAKPOINT = 1024;

export default function DashboardHeader() {
  const {
    logout,
    tenantSlug: storedTenantSlug,
    userName,
    userRole,
  } = useAuth();
  const { tenant } = useDashboardData();
  const { isOpen: hostelSidebarOpen, setIsOpen: setHostelSidebarOpen } =
    useHostelSidebarState();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);

  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

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

  useEffect(() => {
    const theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
  }, [dark]);

  /*
   * Close the menu when clicking outside.
   */
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }

      if (
        profileOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }
    }

    if (menuOpen || profileOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen, profileOpen]);

  /*
   * Hostel mobile/tablet navigation uses the same dropdown
   * interaction as the normal dashboard.
   *
   * When switching to desktop, close the dropdown because the
   * Hostel sidebar becomes the navigation source.
   */
  useEffect(() => {
    if (!isHostelDashboard) return;

    const mediaQuery = window.matchMedia(
      `(min-width: ${DESKTOP_BREAKPOINT}px)`,
    );
    const updateDesktopViewport = () =>
      setIsDesktopViewport(mediaQuery.matches);

    updateDesktopViewport();
    mediaQuery.addEventListener('change', updateDesktopViewport);

    return () => {
      mediaQuery.removeEventListener('change', updateDesktopViewport);
    };
  }, [isHostelDashboard]);

  useEffect(() => {
    if (!isHostelDashboard) return;

    const handleResize = () => {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) {
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
    if (
      !menuOpen &&
      !profileOpen &&
      !(isHostelDashboard && isDesktopViewport && hostelSidebarOpen)
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        if (profileOpen) {
          setProfileOpen(false);
          profileButtonRef.current?.focus();
          return;
        }
        if (isHostelDashboard && isDesktopViewport) {
          setHostelSidebarOpen(false);
          document.getElementById('hostel-sidebar-toggle')?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isDesktopViewport,
    isHostelDashboard,
    menuOpen,
    profileOpen,
    hostelSidebarOpen,
    setHostelSidebarOpen,
  ]);

  function toggle() {
    setDark((prev) => !prev);
  }

  /*
   * The Hostel menu is a dropdown below desktop width and toggles
   * the dedicated sidebar at desktop width.
   */
  const handleMenuClick = () => {
    if (isHostelDashboard) {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) {
        setHostelSidebarOpen((prev) => !prev);
        return;
      }

      setMenuOpen((prev) => !prev);
      return;
    }

    setMenuOpen((prev) => !prev);
  };

  const goToSettings = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? '?tenant=' + tenantQuery : '';

    router.push('/dashboard/settings' + query);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const goToCustomize = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? '?tenant=' + tenantQuery : '';

    router.push('/dashboard/customize' + query);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const goToAnalytics = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? '?tenant=' + tenantQuery : '';

    router.push('/dashboard/analytics' + query);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const goToHostel = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? '?tenant=' + tenantQuery : '';

    router.push('/dashboard/hostel' + query);
    setMenuOpen(false);
    setProfileOpen(false);
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
    setProfileOpen(false);
  };

  const goHome = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? `?tenant=${tenantQuery}` : '';

    router.push(`/dashboard${query}`);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const goToHelp = () => {
    const tenantQuery = searchParams.get('tenant');
    const query = tenantQuery ? `?tenant=${tenantQuery}` : '';

    router.push(`/dashboard/help${query}`);
    setMenuOpen(false);
    setProfileOpen(false);
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
    setProfileOpen(false);
  };

  const globalNavigationItems = [
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
      key: 'settings',
      label: 'Settings',
      onPress: goToSettings,
    },
    {
      key: 'help',
      label: 'Help',
      onPress: goToHelp,
    },
  ];

  const dashboardNavigationItems = [
    ...globalNavigationItems,
    {
      key: 'hostel',
      label: 'Hostel',
      onPress: goToHostel,
    },
  ];

  const isGlobalItemActive = (key: string) =>
    (key === 'home' && pathname === '/dashboard') ||
    (key === 'customize' && pathname.startsWith('/dashboard/customize')) ||
    (key === 'analytics' && pathname.startsWith('/dashboard/analytics')) ||
    (key === 'settings' && pathname.startsWith('/dashboard/settings')) ||
    (key === 'help' && pathname.startsWith('/dashboard/help'));

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
            id={isHostelDashboard ? 'hostel-sidebar-toggle' : undefined}
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
                ? isDesktopViewport
                  ? hostelSidebarOpen
                    ? 'Close hostel sidebar'
                    : 'Open hostel sidebar'
                  : menuOpen
                    ? 'Close hostel navigation'
                    : 'Open hostel navigation'
                : 'Open menu'
            }
            aria-expanded={
              isHostelDashboard && isDesktopViewport
                ? hostelSidebarOpen
                : menuOpen
            }
            aria-controls={
              isHostelDashboard
                ? isDesktopViewport
                  ? 'hostel-sidebar'
                  : 'hostel-mobile-navigation'
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
                visibility: menuOpen ? 'visible' : 'hidden',
                transition:
                  'opacity 160ms ease, transform 160ms ease',
                zIndex: 200,
              }}
            >
              {dashboardNavigationItems.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={item.onPress}
                  aria-current={
                    isGlobalItemActive(item.key) ? 'page' : undefined
                  }
                  style={{
                    width: '100%',
                    border: 'none',
                    borderRadius: 10,
                    background: isGlobalItemActive(item.key)
                      ? 'var(--primary-soft, #eff6ff)'
                      : 'transparent',
                    color: 'var(--text)',
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
                visibility: menuOpen ? 'visible' : 'hidden',
                transition:
                  'opacity 160ms ease, transform 160ms ease',
                zIndex: 200,
              }}
            >
              <div className="hostel-global-mobile-links">
                <div className="hostel-navigation-group-title">
                  Dashboard
                </div>
                {globalNavigationItems.map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={item.onPress}
                    aria-current={
                      isGlobalItemActive(item.key) ? 'page' : undefined
                    }
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: 10,
                      background: isGlobalItemActive(item.key)
                        ? 'var(--primary-soft)'
                        : 'transparent',
                      color: 'var(--text)',
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 14,
                      fontWeight: isGlobalItemActive(item.key) ? 600 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div
                aria-hidden="true"
                style={{
                  height: 1,
                  margin: '6px 4px',
                  background: 'var(--card-border)',
                }}
              />
              <div className="hostel-navigation-group-title">
                Hostel Workspace
              </div>
              <HostelWorkspaceNavigation
                idPrefix="hostel-mobile-navigation"
                onNavigate={() => setMenuOpen(false)}
              />
            </div>
          )}
        </div>

        <nav
          aria-label="Global navigation"
          className="dashboard-global-navigation"
        >
          {globalNavigationItems.map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={item.onPress}
              aria-current={isGlobalItemActive(item.key) ? 'page' : undefined}
              className={
                isGlobalItemActive(item.key) ? 'global-navigation-active' : ''
              }
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <div
            ref={profileMenuRef}
            className="dashboard-profile-menu"
            style={{ position: 'relative' }}
          >
            <button
              ref={profileButtonRef}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setProfileOpen((previous) => !previous);
              }}
              aria-label="Open user profile menu"
              aria-haspopup="true"
              aria-expanded={profileOpen}
              aria-controls="dashboard-profile-navigation"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 10px',
                border: '1px solid transparent',
                borderRadius: 10,
                background: profileOpen
                  ? 'var(--primary-soft, #eff6ff)'
                  : 'transparent',
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <UserRound size={18} aria-hidden="true" />
              <span className="dashboard-profile-name">
                {userName?.trim() || 'Profile'}
              </span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
            <div
              id="dashboard-profile-navigation"
              role="group"
              aria-label="User profile"
              aria-hidden={!profileOpen}
              className={`dashboard-profile-dropdown ${
                profileOpen ? 'is-open' : ''
              }`}
            >
              <div
                role="presentation"
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--card-border)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  User Profile
                </div>
                <div
                  style={{
                    marginTop: 4,
                    color: 'var(--muted)',
                    fontSize: 12,
                  }}
                >
                  {userName?.trim() || 'Signed-in user'}
                  {userRole ? ` · ${userRole}` : ''}
                </div>
              </div>
              <button
                type="button"
                tabIndex={profileOpen ? 0 : -1}
                onClick={goToSettings}
              >
                Account Settings
              </button>
              <button
                type="button"
                tabIndex={profileOpen ? 0 : -1}
                onClick={goToHelp}
              >
                Help
              </button>
              <button
                type="button"
                tabIndex={profileOpen ? 0 : -1}
                className="dashboard-profile-logout"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
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
        .dashboard-global-navigation {
          display: none;
        }

        .dashboard-global-navigation button {
          border: 0;
          border-radius: 8px;
          padding: 9px 10px;
          background: transparent;
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
        }

        .dashboard-global-navigation button:hover,
        .dashboard-global-navigation button.global-navigation-active {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .hostel-navigation-group-title {
          padding: 8px 12px 5px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .dashboard-profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 300;
          width: 220px;
          padding: 6px;
          border: 1px solid var(--card-border);
          border-radius: 12px;
          background: var(--card);
          box-shadow: 0 14px 30px var(--shadow);
          opacity: 0;
          transform: translateY(-6px);
          visibility: hidden;
          pointer-events: none;
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .dashboard-profile-dropdown.is-open {
          opacity: 1;
          transform: translateY(0);
          visibility: visible;
          pointer-events: auto;
        }

        .dashboard-profile-dropdown button {
          width: 100%;
          border: 0;
          border-radius: 8px;
          padding: 10px 12px;
          background: transparent;
          color: var(--text);
          text-align: left;
          font-size: 14px;
          cursor: pointer;
        }

        .dashboard-profile-dropdown button:hover,
        .dashboard-profile-dropdown button:focus-visible {
          background: var(--primary-soft, #eff6ff);
        }

        .dashboard-profile-dropdown button.dashboard-profile-logout {
          margin-top: 4px;
          border-top: 1px solid var(--card-border);
          border-radius: 0 0 8px 8px;
          color: #dc2626;
        }

        .hostel-mobile-navigation {
          display: block;
        }

        @media (min-width: ${DESKTOP_BREAKPOINT}px) {
          .hostel-mobile-navigation {
            display: none;
          }
        }

        @media (min-width: ${DESKTOP_BREAKPOINT}px) {
          .dashboard-global-navigation {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: clamp(2px, 0.7vw, 10px);
            flex: 1;
            min-width: 0;
          }
        }

        @media (max-width: 520px) {
          .dashboard-profile-name {
            display: none;
          }
        }
      `}</style>
    </>
  );
}