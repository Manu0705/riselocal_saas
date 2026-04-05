import type { ResolvedTenant } from '@/lib/tenant-resolver';
import DefaultTheme from './defaultTheme';
import ThemeBusiness from './themeBusiness';
import ThemeMinimal from './themeMinimal';
import ThemeModern from './themeModern';
import { resolveTenantThemeKey } from './theme-utils';

type Props = {
  tenant: ResolvedTenant;
  tenantSlug: string;
};

export default function ThemeRenderer({ tenant, tenantSlug }: Readonly<Props>) {
  const theme = resolveTenantThemeKey(tenant);

  switch (theme) {
    case 'modern':
      return <ThemeModern tenant={tenant} tenantSlug={tenantSlug} />;
    case 'minimal':
      return <ThemeMinimal tenant={tenant} tenantSlug={tenantSlug} />;
    case 'business':
      return <ThemeBusiness tenant={tenant} tenantSlug={tenantSlug} />;
    case 'default':
    default:
      return <DefaultTheme tenant={tenant} tenantSlug={tenantSlug} />;
  }
}
