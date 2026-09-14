'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { getHostelNavigation } from '@/lib/hostel-navigation';

export default function HostelSidebar() {
  const pathname = usePathname();
  const { userRole } = useAuth();

  const navigation = getHostelNavigation(userRole);

  const roleLabel = userRole
    ? `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}`
    : 'User';

  const isActive = (href: string) =>
    pathname === href ||
    (href !== '/dashboard/hostel' &&
      pathname.startsWith(`${href}/`));

  return (
    <aside className="hostel-sidebar">
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

      <style jsx>{`
        .hostel-sidebar {
          background: var(--bg, #ffffff);
          border-color: var(--border, #e5e7eb);

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
         * The Hostel sidebar is intentionally desktop-only.
         *
         * On mobile/tablet, DashboardHeader provides the Hostel
         * dropdown navigation instead.
         */
        @media (max-width: 900px) {
          .hostel-sidebar {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}