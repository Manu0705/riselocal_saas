import { Suspense } from 'react';
import BottomNav from '@/components/bottom-nav';
import DashboardHeader from './components/dashboard-header';
import RequireAuth from './components/require-auth';
import { DashboardDataProvider } from '@/context/DashboardDataContext';
import DashboardTenantFontScope from './components/dashboard-tenant-font-scope';
import DashboardShell from './components/dashboard-shell';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #f4f7ff 0%, #f7f9fc 48%, #eef2f8 100%)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        paddingLeft: 'var(--app-edge)',
        paddingRight: 'var(--app-edge)',
      }}
    >
      <div
        style={{
          width: 'min(100%, var(--app-max-width))',
          background: 'var(--bg)',
          minHeight: '100vh',
          boxShadow: '0 0 20px rgba(0,0,0,0.05)',
          paddingBottom: 100,
        }}
      >
        <Suspense fallback={null}>
          <RequireAuth>
            <DashboardTenantFontScope>
              <DashboardDataProvider>
                <DashboardHeader />

                  <DashboardShell>
                    {children}
                  </DashboardShell>

                <BottomNav />
              </DashboardDataProvider>
            </DashboardTenantFontScope>
          </RequireAuth>
        </Suspense>
      </div>
    </div>
  );
}
