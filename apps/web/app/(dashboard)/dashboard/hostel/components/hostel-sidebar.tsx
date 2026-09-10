'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { getHostelNavigation } from '@/lib/hostel-navigation';

export default function HostelSidebar() {
  const pathname = usePathname();
  const { userRole } = useAuth();

  const navigation = getHostelNavigation(userRole);

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        borderRight: '1px solid var(--border, #e5e7eb)',
        background: 'var(--bg, #ffffff)',
        padding: '20px 12px',
      }}
    >
      <div
        style={{
          padding: '0 12px 16px',
          borderBottom: '1px solid var(--border, #e5e7eb)',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--muted, #6b7280)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Hostel Management
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--foreground, #111827)',
          }}
        >
          {userRole
            ? `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}`
            : 'User'}
        </div>
      </div>

      <nav
        aria-label="Hostel navigation"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard/hostel' &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 42,
                padding: '0 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive
                  ? 'var(--primary, #2563eb)'
                  : 'var(--foreground, #374151)',
                background: isActive
                  ? 'var(--primary-soft, #eff6ff)'
                  : 'transparent',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}