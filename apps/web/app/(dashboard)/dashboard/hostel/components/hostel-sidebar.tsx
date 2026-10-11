'use client';

import { X } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useHostelSidebarState } from '../../components/hostel-sidebar-state';
import HostelWorkspaceNavigation from './hostel-workspace-navigation';

export default function HostelSidebar() {
  const { userRole } = useAuth();
  const { isOpen, setIsOpen } = useHostelSidebarState();

  const roleLabel = userRole ? `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}` : 'User';

  return (
    <aside id="hostel-sidebar" className={`hostel-sidebar ${isOpen ? 'is-open' : 'is-closed'}`}>
      <div className="hostel-sidebar-heading">
        <div>
          <div className="hostel-sidebar-eyebrow">Hostel Management</div>

          <div className="hostel-sidebar-role">{roleLabel}</div>
        </div>

        <button
          type="button"
          className="hostel-sidebar-close"
          onClick={() => {
            setIsOpen(false);
            document.getElementById('hostel-sidebar-toggle')?.focus();
          }}
          aria-label="Close hostel sidebar"
          aria-expanded={isOpen}
          aria-controls="hostel-sidebar"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <HostelWorkspaceNavigation idPrefix="hostel-sidebar-navigation" />

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

        .hostel-sidebar-close {
          display: none;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: var(--muted, #6b7280);
          font-size: 24px;
          line-height: 1;
        }

        .hostel-sidebar-close:hover {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
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

        /*
         * The Hostel sidebar is intentionally desktop-only.
         *
         * On mobile/tablet, DashboardHeader provides the Hostel
         * dropdown navigation instead.
         */
        @media (max-width: 1023px) {
          .hostel-sidebar {
            display: none;
          }
        }

        @media (min-width: 1024px) {
          .hostel-sidebar-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
          }

          .hostel-sidebar-close {
            display: inline-flex;
          }

          .hostel-sidebar.is-closed {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
