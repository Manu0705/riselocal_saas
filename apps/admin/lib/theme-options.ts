export type ThemeKey = 'default' | 'modern' | 'business' | 'minimal';

export const THEME_OPTIONS = [
  {
    value: 'default',
    label: 'Default Theme',
    shortLabel: 'Default',
    bestFor: 'General local businesses',
    description: 'Keeps the existing storefront layout and flow unchanged.',
  },
  {
    value: 'modern',
    label: 'Modern Tech',
    shortLabel: 'Tech',
    bestFor: 'Computer, mobile, and hardware stores',
    description: 'Sharper product-first design with stock, pricing, and repair-focused CTAs.',
  },
  {
    value: 'business',
    label: 'Business Security',
    shortLabel: 'Security',
    bestFor: 'CCTV and surveillance businesses',
    description: 'Trust-led layout for surveys, installation requests, and AMC follow-up.',
  },
  {
    value: 'minimal',
    label: 'Minimal Beauty',
    shortLabel: 'Beauty',
    bestFor: 'Salon, spa, and beauty parlour tenants',
    description: 'Soft premium presentation built around appointments and gallery-driven enquiries.',
  },
] as const;

export function getThemeLabel(themeKey?: string | null) {
  return THEME_OPTIONS.find((option) => option.value === themeKey)?.label || 'Default Theme';
}
