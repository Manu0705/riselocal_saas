import type { TenantThemeKey } from '@saas/domain-core/tenant.contract';
import { TENANT_THEME_KEYS } from '@saas/domain-core/tenant.contract';

export type ThemeKey = TenantThemeKey;

export const THEME_OPTIONS = [
  {
    value: 'default' as const,
    label: 'Default Theme',
    shortLabel: 'Default',
    bestFor: 'General local businesses',
    description: 'Keeps the existing storefront layout and flow unchanged.',
  },
  {
    value: 'modern' as const,
    label: 'Modern Tech',
    shortLabel: 'Tech',
    bestFor: 'Computer, mobile, and hardware stores',
    description: 'Sharper product-first design with stock, pricing, and repair-focused CTAs.',
  },
  {
    value: 'business' as const,
    label: 'Business Security',
    shortLabel: 'Security',
    bestFor: 'CCTV and surveillance businesses',
    description: 'Trust-led layout for surveys, installation requests, and AMC follow-up.',
  },
  {
    value: 'minimal' as const,
    label: 'Minimal Beauty',
    shortLabel: 'Beauty',
    bestFor: 'Salon, spa, and beauty parlour tenants',
    description: 'Soft premium presentation built around appointments and gallery-driven enquiries.',
  },
] as const satisfies ReadonlyArray<{
  value: ThemeKey;
  label: string;
  shortLabel: string;
  bestFor: string;
  description: string;
}>;

// Keep options aligned with the shared contract.
void TENANT_THEME_KEYS;

export function getThemeLabel(themeKey?: string | null) {
  return THEME_OPTIONS.find((option) => option.value === themeKey)?.label || 'Default Theme';
}
