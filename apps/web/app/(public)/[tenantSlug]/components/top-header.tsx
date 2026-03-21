'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Menu } from 'lucide-react';

type Props = {
  title: string;
  tenantSlug?: string;
  logoUrl?: string;
  logoShape?: string;
};

export default function TopHeader({ title, tenantSlug, logoUrl, logoShape }: Readonly<Props>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, tenantSlug: storedTenant, setTenant, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!tenantSlug) return;
    if (storedTenant === tenantSlug) return;
    setTenant(tenantSlug);
  }, [tenantSlug, storedTenant, setTenant]);

  useEffect(() => {
    // Force light mode on public pages
    document.documentElement.dataset.theme = 'light';
  }, []);

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

  const activeTenant = tenantSlug ?? storedTenant ?? 'default';
  const canToggleViews = isAuthenticated && Boolean(activeTenant);
  const isPublicPreview = searchParams.get('view') === 'public';
  const showMenu = canToggleViews && !isPublicPreview;

  useEffect(() => {
    if (!activeTenant) return;
    router.prefetch(`/${activeTenant}`);
    router.prefetch(`/${activeTenant}?view=public`);
  }, [router, activeTenant]);

  const goToDashboard = () => {
    router.push(`/dashboard?tenant=${activeTenant}`);
    setMenuOpen(false);
  };

  const goToCustomize = () => {
    router.push(`/dashboard/customize?tenant=${activeTenant}`);
    setMenuOpen(false);
  };

  const goToLeadView = () => {
    router.replace(`/${activeTenant}?view=public`, { scroll: false });
    setMenuOpen(false);
  };

  const goToMyView = () => {
    router.replace(`/${activeTenant}`, { scroll: false });
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push(`/${activeTenant}`);
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
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Left side - Menu or Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        {showMenu ? (
          <>
            <button
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

            {/* Menu Dropdown */}
            <div
              ref={menuRef}
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
                { label: 'Dashboard', onPress: goToDashboard },
                { label: 'Customize', onPress: goToCustomize },
                { label: 'Logout', onPress: handleLogout },
              ].map((item) => (
                <button
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
          </>
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: logoShape === 'square' ? 6 : '50%',
              border: '1px solid var(--card-border)',
              flexShrink: 0,
            }}
          >
            <Image
              src={logoUrl || '/logo/JB_Logo.jpeg'}
              alt="logo"
              fill
              sizes="40px"
              style={{
                objectFit: 'cover',
              }}
              priority={true}
            />
          </div>
        )}
      </div>

      {/* Center - Title */}
      <span
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 'clamp(18px, 2.2vw, 24px)',
          fontWeight: 700,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: 'default',
        }}
      >
        {title}
      </span>

      {/* Right side - Lead View / My View toggle for authenticated users */}
      {canToggleViews && (
        <button
          onClick={isPublicPreview ? goToMyView : goToLeadView}
          className={isPublicPreview ? 'blink-my-view' : undefined}
          style={{
            fontSize: 11,
            border: '1px solid var(--card-border)',
            background: 'transparent',
            color: 'var(--text)',
            padding: '5px 10px',
            borderRadius: 999,
            fontWeight: 700,
            lineHeight: '14px',
            whiteSpace: 'nowrap',
          }}
        >
          {isPublicPreview ? 'My View' : 'Lead View'}
        </button>
      )}
      {!canToggleViews && <div style={{ width: 40, height: 40 }} />}
    </div>
  );
}
