import { notFound } from 'next/navigation';
import { getTenant, isReservedTenantSlug } from '@/lib/tenant-resolver';
import TenantPageWrapper from './tenant-page-wrapper';
import ThemeRenderer from './themes/theme-renderer';

type Props = Readonly<{
  params: {
    tenantSlug: string;
  };
}>;

export default async function TenantPage({ params }: Props) {
  const { tenantSlug } = params;

  // Prevent dashboard routes from being treated as tenants
  if (isReservedTenantSlug(tenantSlug)) {
    notFound();
  }

  let tenant = null;

  try {
    tenant = await getTenant(tenantSlug);
  } catch (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 600 }}>
          <h1>Unable to load this page</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            The tenant page could not be loaded at the moment.
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            Please try again later or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    notFound();
  }

  return (
    <TenantPageWrapper>
      <ThemeRenderer tenant={tenant} tenantSlug={tenantSlug} />
    </TenantPageWrapper>
  );
}
