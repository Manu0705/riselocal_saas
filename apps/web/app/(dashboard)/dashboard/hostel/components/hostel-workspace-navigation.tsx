'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Building2,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  Settings2,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  getHostelNavigation,
  HOSTEL_NAVIGATION_GROUPS,
  type HostelNavigationGroupId,
} from '@/lib/hostel-navigation';
import { useAuth } from '@/context/AuthContext';

const GROUP_ICONS: Record<HostelNavigationGroupId, LucideIcon> = {
  overview: LayoutDashboard,
  people: Users,
  'hostel-operations': Building2,
  finance: WalletCards,
  communication: MessageSquare,
  reports: BarChart3,
  administration: Settings2,
};

export default function HostelWorkspaceNavigation({
  onNavigate,
  idPrefix = 'hostel-workspace',
}: {
  onNavigate?: () => void;
  idPrefix?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userRole } = useAuth();
  const navigation = useMemo(() => getHostelNavigation(userRole), [userRole]);

  const activeItem = useMemo(
    () =>
      navigation
        .filter(
          (item) =>
            pathname === item.href ||
            (item.href !== '/dashboard/hostel' && pathname.startsWith(`${item.href}/`)),
        )
        .sort((left, right) => right.href.length - left.href.length)[0],
    [navigation, pathname],
  );

  const activeGroup = activeItem?.group ?? null;
  const [expandedGroup, setExpandedGroup] = useState<HostelNavigationGroupId | null>(activeGroup);

  useEffect(() => {
    if (activeGroup) {
      setExpandedGroup(activeGroup);
    }
  }, [activeGroup, pathname]);

  const groups = HOSTEL_NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: navigation.filter((item) => item.group === group.id),
  })).filter((group) => group.items.length > 0);

  const tenantQuery = searchParams.get('tenant');
  const tenantSuffix = tenantQuery ? `?tenant=${encodeURIComponent(tenantQuery)}` : '';

  return (
    <nav aria-label="Hostel workspace navigation" className="hostel-workspace-nav">
      {groups.map((group) => {
        const Icon = GROUP_ICONS[group.id];
        const isExpanded = expandedGroup === group.id;
        const isActiveGroup = activeGroup === group.id;
        const overviewItem = group.items[0];

        if (group.id === 'overview') {
          return (
            <Link
              key={group.id}
              href={`${overviewItem.href}${tenantSuffix}`}
              className={`hostel-workspace-group hostel-workspace-overview ${
                isActiveGroup ? 'active' : ''
              }`}
              aria-current={isActiveGroup ? 'page' : undefined}
              onClick={onNavigate}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 11,
                width: '100%',
                minHeight: 40,
                padding: '0 12px',
                boxSizing: 'border-box',
              }}
            >
              <Icon
                size={18}
                aria-hidden="true"
                style={{ display: 'block', flex: '0 0 18px' }}
              />
              <span
                style={{
                  display: 'inline-block',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {group.label}
              </span>
            </Link>
          );
        }

        const controlId = `${idPrefix}-${group.id}`;

        return (
          <section key={group.id} className="hostel-workspace-section">
            <button
              type="button"
              className={`hostel-workspace-group ${isActiveGroup ? 'active' : ''}`}
              aria-expanded={isExpanded}
              aria-controls={controlId}
              onClick={() =>
                setExpandedGroup((current) => (current === group.id ? null : group.id))
              }
            >
              <Icon size={18} aria-hidden="true" />
              <span>{group.label}</span>
              {isExpanded ? (
                <ChevronDown size={16} className="hostel-workspace-chevron" aria-hidden="true" />
              ) : (
                <ChevronRight size={16} className="hostel-workspace-chevron" aria-hidden="true" />
              )}
            </button>

            <div id={controlId} className="hostel-workspace-submenu" hidden={!isExpanded}>
              {group.items.map((item) => {
                const isActive = activeItem?.href === item.href;

                return (
                  <Link
                    key={item.href}
                    href={`${item.href}${tenantSuffix}`}
                    className={`hostel-workspace-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <span className="hostel-workspace-link-indicator" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <style jsx>{`
        .hostel-workspace-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .hostel-workspace-section {
          min-width: 0;
        }

        .hostel-workspace-group {
          display: flex;
          align-items: center;
          gap: 11px;
          width: 100%;
          min-height: 42px;
          padding: 0 12px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: var(--foreground, #374151);
          text-align: left;
          text-decoration: none;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .hostel-workspace-group:hover,
        .hostel-workspace-group.active {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .hostel-workspace-group:focus-visible,
        .hostel-workspace-link:focus-visible {
          outline: 2px solid var(--primary, #2563eb);
          outline-offset: 2px;
        }

        .hostel-workspace-group > span:first-of-type {
          flex: 1;
          min-width: 0;
        }

        .hostel-workspace-chevron {
          flex: 0 0 auto;
          color: var(--muted, #6b7280);
        }

        .hostel-workspace-submenu {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin: 3px 0 6px 20px;
          padding-left: 12px;
          border-left: 1px solid var(--card-border, #e5e7eb);
        }

        .hostel-workspace-submenu[hidden] {
          display: none;
        }

        .hostel-workspace-link {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 36px;
          min-width: 0;
          padding: 0 10px;
          border-radius: 8px;
          color: var(--muted, #6b7280);
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
        }

        .hostel-workspace-link:hover,
        .hostel-workspace-link.active {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .hostel-workspace-link.active {
          font-weight: 650;
        }

        .hostel-workspace-link-indicator {
          width: 5px;
          height: 5px;
          flex: 0 0 5px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.55;
        }

        @media (max-width: 1023px) {
          .hostel-workspace-group {
            min-height: 40px;
          }

          .hostel-workspace-link {
            min-height: 38px;
          }
        }
      `}</style>
    </nav>
  );
}
