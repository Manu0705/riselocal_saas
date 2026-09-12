'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { getHostelNavigation } from '@/lib/hostel-navigation';

const MOBILE_BREAKPOINT = 900;

export default function HostelSidebar() {
  const pathname = usePathname();
  const { userRole } = useAuth();

  const navigation = getHostelNavigation(userRole);

  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel = userRole
    ? `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}`
    : 'User';

  /*
   * DashboardHeader will dispatch this event when the
   * Hostel mobile menu button is pressed.
   */
  useEffect(() => {
    const handleToggle = () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        setMobileOpen((previous) => !previous);
      }
    };

    const handleClose = () => {
      setMobileOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('hostel-sidebar-toggle', handleToggle);
    window.addEventListener('hostel-sidebar-close', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('hostel-sidebar-toggle', handleToggle);
      window.removeEventListener('hostel-sidebar-close', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /*
   * Close the drawer after navigation.
   */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /*
   * Prevent the page behind the drawer from scrolling.
   */
  useEffect(() => {
    if (!mobileOpen || window.innerWidth > MOBILE_BREAKPOINT) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const handleClose = () => {
    setMobileOpen(false);
  };

  const isActive = (href: string) =>
    pathname === href ||
    (href !== '/dashboard/hostel' &&
      pathname.startsWith(`${href}/`));

  return (
    <>
      {/* Mobile drawer overlay */}
      <button
        type="button"
        aria-label="Close hostel navigation"
        className={`hostel-sidebar-overlay ${
          mobileOpen ? 'visible' : ''
        }`}
        onClick={handleClose}
      />

      {/* Desktop sidebar */}
      <aside className="hostel-sidebar hostel-sidebar-desktop">
        <div className="hostel-sidebar-heading">
          <div className="hostel-sidebar-eyebrow">
            Hostel Management
          </div>

          <div className="hostel-sidebar-role">
            {roleLabel}
          </div>
        </div>

        <nav
          aria-label="Hostel navigation"
          className="hostel-sidebar-nav"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`hostel-sidebar-link ${
                isActive(item.href) ? 'active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`hostel-sidebar hostel-sidebar-mobile ${
          mobileOpen ? 'open' : ''
        }`}
        aria-label="Hostel mobile navigation"
        aria-hidden={!mobileOpen}
      >
        <div className="hostel-mobile-sidebar-header">
          <div>
            <div className="hostel-sidebar-eyebrow">
              Hostel Management
            </div>

            <div className="hostel-sidebar-role">
              {roleLabel}
            </div>
          </div>

          <button
            type="button"
            aria-label="Close hostel navigation"
            onClick={handleClose}
            className="hostel-mobile-close-button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <nav
          aria-label="Hostel mobile navigation"
          className="hostel-sidebar-nav"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`hostel-sidebar-link ${
                isActive(item.href) ? 'active' : ''
              }`}
              onClick={handleClose}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <style jsx>{`
        .hostel-sidebar {
          background: var(--bg, #ffffff);
          border-color: var(--border, #e5e7eb);
        }

        /*
         * Desktop / tablet sidebar.
         */
        .hostel-sidebar-desktop {
          width: 240px;
          min-width: 240px;
          align-self: flex-start;
          position: sticky;
          top: clamp(56px, 6vw, 64px);
          height: calc(100vh - clamp(56px, 6vw, 64px));
          max-height: calc(100vh - clamp(56px, 6vw, 64px));
          overflow-y: auto;
          border-right: 1px solid var(--border, #e5e7eb);
          padding: 20px 12px;
          box-sizing: border-box;
        }

        .hostel-sidebar-heading {
          padding: 0 12px 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
          margin-bottom: 12px;
        }

        .hostel-sidebar-eyebrow {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hostel-sidebar-role {
          margin-top: 4px;
          font-size: 18px;
          font-weight: 700;
          color: var(--foreground, #111827);
        }

        .hostel-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .hostel-sidebar-link {
          display: flex;
          align-items: center;
          min-height: 42px;
          min-width: 0;
          padding: 0 12px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          color: var(--foreground, #374151);
          transition:
            background 0.15s ease,
            color 0.15s ease;
          box-sizing: border-box;
        }

        .hostel-sidebar-link:hover {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .hostel-sidebar-link.active {
          font-weight: 600;
          color: var(--primary, #2563eb);
          background: var(--primary-soft, #eff6ff);
        }

        /*
         * Hidden on desktop.
         */
        .hostel-sidebar-mobile,
        .hostel-sidebar-overlay {
          display: none;
        }

        /*
         * Mobile / tablet drawer.
         */
        @media (max-width: 900px) {
          .hostel-sidebar-desktop {
            display: none;
          }

          .hostel-sidebar-overlay {
            position: fixed;
            top: clamp(56px, 6vw, 64px);
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 998;
            width: 100%;
            height: calc(100vh - clamp(56px, 6vw, 64px));
            padding: 0;
            border: 0;
            background: rgba(0, 0, 0, 0.35);
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
              opacity 0.2s ease,
              visibility 0.2s ease;
          }

          .hostel-sidebar-overlay.visible {
            display: block;
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
          }

          .hostel-sidebar-mobile {
            position: fixed;
            top: clamp(56px, 6vw, 64px);
            left: 0;
            z-index: 999;
            display: flex;
            flex-direction: column;
            width: min(320px, 86vw);
            height: calc(100vh - clamp(56px, 6vw, 64px));
            min-height: 0;
            padding: 20px 12px;
            border-right: 1px solid var(--border, #e5e7eb);
            box-shadow: 8px 0 24px rgba(0, 0, 0, 0.12);
            overflow-x: hidden;
            overflow-y: auto;
            box-sizing: border-box;
            transform: translateX(-105%);
            transition: transform 0.22s ease;
          }

          .hostel-sidebar-mobile.open {
            transform: translateX(0);
          }

          .hostel-mobile-sidebar-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding: 0 12px 16px;
            margin-bottom: 12px;
            border-bottom: 1px solid var(--border, #e5e7eb);
          }

          .hostel-mobile-close-button {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            width: 36px;
            height: 36px;
            padding: 0;
            border: 1px solid var(--border, #e5e7eb);
            border-radius: 8px;
            background: transparent;
            color: var(--foreground, #111827);
            font-size: 24px;
            line-height: 1;
            cursor: pointer;
          }

          .hostel-mobile-close-button:hover {
            background: var(--primary-soft, #eff6ff);
          }

          .hostel-sidebar-mobile .hostel-sidebar-link {
            width: 100%;
            min-height: 44px;
          }
        }

        @media (max-width: 520px) {
          .hostel-sidebar-mobile {
            width: min(290px, 88vw);
            padding: 16px 10px;
          }

          .hostel-mobile-sidebar-header {
            padding-left: 10px;
            padding-right: 10px;
          }
        }
      `}</style>
    </>
  );
}