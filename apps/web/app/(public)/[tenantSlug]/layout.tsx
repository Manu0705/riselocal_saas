import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import TopHeader from './components/top-header';
import MobileContainer from './components/mobile-container';
import { getTenant, isReservedTenantSlug } from '@/lib/tenant-resolver';
import TenantFontScope from './tenant-font-scope';

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

  // Do not catch resolver errors here — network/5xx must surface via error.tsx.
  // Only a confirmed missing tenant (null) becomes notFound().
  const tenant = await getTenant(tenantSlug);

  if (!tenant) {
    notFound();
  }

  return (
    <TenantFontScope fontName={tenant.fontFamily}>
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
    </TenantFontScope>
  );
}
