export const TENANT_THEME_KEYS = ['default', 'modern', 'minimal', 'business'] as const;
export type TenantThemeKey = (typeof TENANT_THEME_KEYS)[number];

const LEGACY_THEME_KEY_MAP: Record<string, TenantThemeKey> = {
  default: 'default',
  'theme-default': 'default',
  themedefault: 'default',
  modern: 'modern',
  'theme-modern': 'modern',
  thememodern: 'modern',
  minimal: 'minimal',
  'theme-minimal': 'minimal',
  thememinimal: 'minimal',
  business: 'business',
  'theme-business': 'business',
  themebusiness: 'business',
  security: 'business',
};

export function normalizeTenantThemeKey(
  value: unknown,
  fallback: TenantThemeKey = 'default',
): TenantThemeKey {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (LEGACY_THEME_KEY_MAP[normalized]) {
    return LEGACY_THEME_KEY_MAP[normalized];
  }

  return (TENANT_THEME_KEYS as readonly string[]).includes(normalized)
    ? (normalized as TenantThemeKey)
    : fallback;
}

export function isTenantThemeKey(value: unknown): value is TenantThemeKey {
  return typeof value === 'string' && (TENANT_THEME_KEYS as readonly string[]).includes(value);
}

export type ActionButtonConfig = {
  enabled: boolean;
  label?: string;
  phone?: string;
  url?: string;
  message?: string;
};

export type ActionButtonsConfig = {
  chatWhatsApp: ActionButtonConfig;
  call: ActionButtonConfig;
  whatsappEnquiry: ActionButtonConfig;
  confirmBooking?: ActionButtonConfig;
};

export type TenantCustomization = {
  logoUrl?: string;
  bannerUrl?: string;
  logoShape: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  theme: TenantThemeKey;
  sectionOrder: string[];
  galleryCategories: string[];
  actionButtons: ActionButtonsConfig;
  businessPhone?: string;
  businessWhatsApp?: string;
  tagline?: string;
  openHour?: number;
  closeHour?: number;
  availableHours?: number[];
};

export type TenantPublicPayload = {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  createdAt: string;
  updatedAt: string;
  theme: TenantThemeKey;
  customization: TenantCustomization;
  services: Array<{
    name: string;
    description?: string;
    icon?: string;
    position?: number;
  }>;
  galleryImages: Array<{
    url: string;
    category: string;
    position: number;
    alt?: string;
  }>;
  socialLinks: Array<{
    platform: string;
    url: string;
    label?: string;
  }>;
};
