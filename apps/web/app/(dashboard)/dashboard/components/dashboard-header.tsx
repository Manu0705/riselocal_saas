'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/context/DashboardDataContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Moon, Sun, Menu } from 'lucide-react';

export default function DashboardHeader() {
  const { logout, tenantSlug: storedTenantSlug } = useAuth();
  const { tenant } = useDashboardData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
  }, [dark]);

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

  function toggle() {
    setDark((prev) => !prev);
  }

  const goToSettings = () => {
    const tenant = searchParams.get('tenant');
    const query = tenant ? '?tenant=' + tenant : '';
    router.push('/dashboard/settings' + query);
    setMenuOpen(false);
  };

  const goToCustomize = () => {
    const tenant = searchParams.get('tenant');
    const query = tenant ? '?tenant=' + tenant : '';
    router.push('/dashboard/customize' + query);
    setMenuOpen(false);
  };

  const goToAnalytics = () => {
    const tenant = searchParams.get('tenant');
    const query = tenant ? '?tenant=' + tenant : '';
    router.push('/dashboard/analytics' + query);
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

    router.push(`/${tenantRouteKey}?view=public`);
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
    const query = tenantQuery ? `?tenant=${tenantQuery}&tab=help` : '?tab=help';
    router.push(`/dashboard/settings${query}`);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    const tenant = searchParams.get('tenant');
    if (tenant) {
      router.push(`/${tenant}`);
    } else {
      router.push('/default');
    }
    setMenuOpen(false);
  };

  return (
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
        style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}
      >
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
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
          }}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <span
          style={{
            fontWeight: 700,
            fontSize: 'clamp(18px, 2.2vw, 24px)',
            color: 'var(--text)',
            letterSpacing: '-0.4px',
          }}
        >
          Dashboard
        </span>

        {/* Menu Dropdown */}
        <div
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
            transform: menuOpen ? 'translateY(0)' : 'translateY(-6px)',
            pointerEvents: menuOpen ? 'auto' : 'none',
            transition: 'opacity 160ms ease, transform 160ms ease',
            zIndex: 200,
          }}
        >
          {[
            { label: 'Home', onPress: goHome },
            { label: 'Lead View', onPress: goToLeadView },
            { label: 'Customize', onPress: goToCustomize },
            { label: 'Analytics', onPress: goToAnalytics },
            { label: 'Settings', onPress: goToSettings },
            { label: 'Help', onPress: goToHelp },
            { label: 'Logout', onPress: handleLogout },
          ].map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={item.onPress}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: 10,
                background: 'transparent',
                color: item.label === 'Logout' ? '#dc2626' : 'var(--text)',
                padding: '10px 12px',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
          }}
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  );
}
