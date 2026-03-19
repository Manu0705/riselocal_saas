import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import TopHeader from './components/top-header';
import MobileContainer from './components/mobile-container';
import { getTenant, isReservedTenantSlug } from '@/lib/tenant-resolver';

export default async function TenantLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { tenantSlug: string };
}>) {
  const { tenantSlug } = params;

  // Prevent reserved routes from being treated as tenants
  if (isReservedTenantSlug(tenantSlug)) {
    notFound();
  }

  const tenant = await getTenant(tenantSlug);

  // Return 404 if tenant does not exist in database
  if (!tenant) {
    notFound();
  }

  return (
    <MobileContainer>
      <Suspense fallback={null}>
        <TopHeader
          title={tenant.name ?? 'Business'}
          tenantSlug={tenantSlug}
          logoUrl={tenant.logoUrl}
          logoShape={tenant.logoShape}
        />

        <div
          style={{
            padding: '16px',
            flex: 1,
          }}
        >
          {children}
        </div>
      </Suspense>
    </MobileContainer>
  );
}
