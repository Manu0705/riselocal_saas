'use client';

import { useDashboardData } from '@/context/DashboardDataContext';
import { usePathname } from 'next/navigation';
import HostelSidebar from '../hostel/components/hostel-sidebar';

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant, tenantResolved } = useDashboardData();
  const pathname = usePathname();

  const isHostelTheme =
    tenantResolved &&
    tenant?.theme?.trim().toLowerCase() === 'hostel';

  const isHostelRoute = pathname.startsWith('/dashboard/hostel');

  /*
   * The /dashboard/hostel/* route tree already renders
   * its own HostelSidebar through dashboard/hostel/layout.tsx.
   *
   * Render the sidebar here only when the Hostel theme is
   * displayed on the root /dashboard route.
   */
  const shouldRenderHostelSidebar =
    isHostelTheme && !isHostelRoute;

  if (!shouldRenderHostelSidebar) {
    return <>{children}</>;
  }

  return (
    <div
      className="dashboard-hostel-shell"
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 120px)',
        width: '100%',
        minWidth: 0,
      }}
    >
      <HostelSidebar />

      <main
        className="dashboard-hostel-shell-main"
        style={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>
    </div>
  );
}