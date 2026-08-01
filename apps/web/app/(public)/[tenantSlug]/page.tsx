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

  const tenant = await getTenant(tenantSlug);

  if (!tenant) {
    notFound();
  }

  return (
    <TenantPageWrapper>
      <ThemeRenderer tenant={tenant} tenantSlug={tenantSlug} />
    </TenantPageWrapper>
  );
}
