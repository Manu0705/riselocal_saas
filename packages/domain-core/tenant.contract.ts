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

/** Resolve theme from either `theme` or legacy `themeKey` input fields. */
export function resolveThemeInput(value: unknown): TenantThemeKey {
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    return normalizeTenantThemeKey(record.theme ?? record.themeKey);
  }

  return normalizeTenantThemeKey(value);
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

export const DEFAULT_ACTION_BUTTONS: ActionButtonsConfig = {
  chatWhatsApp: { enabled: true, label: 'Chat on WhatsApp' },
  call: { enabled: true, label: 'Call' },
  whatsappEnquiry: { enabled: true, label: 'WhatsApp Enquiry' },
  confirmBooking: { enabled: true, label: 'Confirm Booking' },
};

export function getDefaultActionButtons(): ActionButtonsConfig {
  return {
    chatWhatsApp: { ...DEFAULT_ACTION_BUTTONS.chatWhatsApp },
    call: { ...DEFAULT_ACTION_BUTTONS.call },
    whatsappEnquiry: { ...DEFAULT_ACTION_BUTTONS.whatsappEnquiry },
    confirmBooking: { ...DEFAULT_ACTION_BUTTONS.confirmBooking },
  };
}

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Full action-button normalizer used by both public tenant and settings routes.
 * Preserves label, phone, url, and message so neither route drops the other's fields.
 */
export function normalizeActionButtonConfig(
  value: unknown,
  fallback: ActionButtonConfig,
): ActionButtonConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    enabled: raw.enabled === undefined ? fallback.enabled : Boolean(raw.enabled),
    label: optionalTrimmedString(raw.label) ?? fallback.label,
    phone: optionalTrimmedString(raw.phone),
    url: optionalTrimmedString(raw.url),
    message: optionalTrimmedString(raw.message),
  };
}

export function normalizeActionButtons(value: unknown): ActionButtonsConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const defaults = getDefaultActionButtons();

  return {
    chatWhatsApp: normalizeActionButtonConfig(raw.chatWhatsApp, defaults.chatWhatsApp),
    call: normalizeActionButtonConfig(raw.call, defaults.call),
    whatsappEnquiry: normalizeActionButtonConfig(raw.whatsappEnquiry, defaults.whatsappEnquiry),
    confirmBooking: normalizeActionButtonConfig(
      raw.confirmBooking,
      defaults.confirmBooking ?? { enabled: true, label: 'Confirm Booking' },
    ),
  };
}

export function normalizeHour(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 23) {
      return parsed;
    }
  }

  return undefined;
}

export function normalizeAvailableHours(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const hours = value
    .map((entry) => normalizeHour(entry))
    .filter((hour): hour is number => typeof hour === 'number');

  return hours.length > 0 ? hours : undefined;
}

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
