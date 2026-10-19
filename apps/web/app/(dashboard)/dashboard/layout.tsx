import { Suspense } from 'react';
import RequireAuth from './components/require-auth';
import { DashboardDataProvider } from '@/context/DashboardDataContext';
import DashboardTenantFontScope from './components/dashboard-tenant-font-scope';
import DashboardLayoutContent from './components/dashboard-layout-content';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="dashboard-layout-viewport"
      style={{
        background: 'linear-gradient(180deg, #f4f7ff 0%, #f7f9fc 48%, #eef2f8 100%)',
        minHeight: '100vh',
        display: 'flex',
      }}
    >
      <div
        className="dashboard-layout-panel"
        style={{
          background: 'var(--bg)',
          minHeight: '100vh',
          boxShadow: '0 0 20px rgba(0,0,0,0.05)',
        }}
      >
        <Suspense fallback={null}>
          <RequireAuth>
            <DashboardTenantFontScope>
              <DashboardDataProvider>
                <DashboardLayoutContent>
                  {children}
                </DashboardLayoutContent>
              </DashboardDataProvider>
            </DashboardTenantFontScope>
          </RequireAuth>
        </Suspense>
      </div>
    </div>
  );
}
