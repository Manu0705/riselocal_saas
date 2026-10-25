
'use client';

import type { ReactNode } from 'react';
import { useDashboardData } from '@/context/DashboardDataContext';
import BottomNav from '@/components/bottom-nav';
import DashboardHeader from './dashboard-header';
import DashboardShell from './dashboard-shell';
import { HostelSidebarStateProvider } from './hostel-sidebar-state';

export default function DashboardLayoutContent({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { tenantResolved } = useDashboardData();

  // Never display the default dashboard shell while the tenant
  // theme is still being resolved.
  if (!tenantResolved) {
    return (
      <div
        role="status"
        aria-label="Loading workspace"
        style={{
          minHeight: '100vh',
          width: '100%',
          background: 'var(--bg, #f7f9fc)',
        }}
      />
    );
  }

  return (
    <HostelSidebarStateProvider>
      <DashboardHeader />

      <DashboardShell>
        {children}
      </DashboardShell>

      <BottomNav />
    </HostelSidebarStateProvider>
  );
}
