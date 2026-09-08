import type { ResolvedTenant } from '@/lib/tenant-resolver';
import { resolveThemeInput, type TenantThemeKey } from '@saas/domain-core/tenant.contract';

export const TENANT_THEME_OPTIONS: Array<{
  key: TenantThemeKey;
  label: string;
  description: string;
}> = [
  {
    key: 'default',
    label: 'Default Theme',
    description: 'Keeps the current storefront layout as-is.',
  },
  {
    key: 'modern',
    label: 'Modern Tech',
    description: 'Great for computer, laptop, mobile, and hardware stores.',
  },
  {
    key: 'minimal',
    label: 'Minimal Beauty',
    description: 'Soft premium styling for salons and beauty parlours.',
  },
  {
    key: 'business',
    label: 'Business Security',
    description: 'Professional storefront for CCTV and security-focused tenants.',
  },
  {
    key: 'hostel',
    label: 'Hostel',
    description: 'Professional storefront for hostels and student accommodation.',
  },
];

function toTenantSearchText(tenant: ResolvedTenant): string {
  const services = Array.isArray(tenant.services)
    ? tenant.services
        .map((service) => `${service?.name ?? ''} ${service?.description ?? ''}`.trim())
        .join(' ')
    : '';

  return [tenant.name, tenant.tagline, services]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

export function inferTenantThemeKey(tenant: ResolvedTenant): TenantThemeKey {
  const searchText = toTenantSearchText(tenant);

  const minimalKeywords = ['salon', 'beauty', 'parlour', 'parlor', 'spa', 'makeup', 'hair', 'skin', 'bridal'];
  if (minimalKeywords.some((keyword) => searchText.includes(keyword))) {
    return 'minimal';
  }

  const businessKeywords = ['cctv', 'camera', 'security', 'surveillance', 'access control', 'alarm'];
  if (businessKeywords.some((keyword) => searchText.includes(keyword))) {
    return 'business';
  }

  const hostelKeywords = ['hostel', 'hostels', 'student accommodation', 'student residence', 'pg accommodation', 'paying guest', 'boys hostel', 'girls hostel'];
  if (hostelKeywords.some((keyword) => searchText.includes(keyword))) {
    return 'hostel';
  }

  const modernKeywords = ['laptop', 'computer', 'mobile', 'hardware', 'electronics', 'accessories', 'printer', 'desktop'];
  if (modernKeywords.some((keyword) => searchText.includes(keyword))) {
    return 'modern';
  }

  return 'default';
}

export function resolveTenantThemeKey(tenant: ResolvedTenant): TenantThemeKey {
  if (tenant.theme || tenant.themeKey) {
    return resolveThemeInput({ theme: tenant.theme, themeKey: tenant.themeKey });
  }

  return inferTenantThemeKey(tenant);
}
