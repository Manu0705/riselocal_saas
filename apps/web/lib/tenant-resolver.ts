import { buildUpstreamApiUrl, getApiBaseCandidates } from '@/lib/api-endpoint';
import { DEFAULT_TENANT_FONT, sanitizeTenantFontName } from '@/lib/tenant-font';
import { fetchWithRetry } from '@/lib/retry';
import { cache } from 'react';
import {
  DEFAULT_ACTION_BUTTONS,
  normalizeActionButtons,
  normalizeTenantThemeKey,
  type ActionButtonsConfig,
  type TenantPublicPayload,
  type TenantThemeKey,
} from '@saas/domain-core/tenant.contract';
export const RESERVED_ROUTES = [
  'dashboard',
  'admin',
  'analytics',
  'leads',
  'followups',
  'feedback',
  'tenants',
  'settings',
  'login',
  'api',
  '_next',
  'qa',
  'www',
];

export const isReservedTenantSlug = (slug: string) => RESERVED_ROUTES.includes(slug);

const DEFAULT_OPEN_HOUR = 9;
const DEFAULT_CLOSE_HOUR = 21;

export type ResolvedTenant = {
  id?: string;
  name?: string;
  slug?: string;
  domain?: string;
  phone?: string;
  whatsapp?: string;
  tagline?: string;
  logoUrl?: string;
  bannerUrl?: string;
  logoShape?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  theme?: TenantThemeKey;
  themeKey?: string;
  sectionOrder?: string[];
  galleryCategories?: string[];
  actionButtons?: ActionButtonsConfig;
  services?: Array<{ name: string; description?: string }>;
  gallery?: Array<{ url: string; category: string }>;
  socialLinks?: Array<{ platform?: string; url?: string; label?: string }>;
  products?: string[];
  openHour?: number;
  closeHour?: number;
  availableHours?: number[];
};

export const getTenant = cache(async (slug: string): Promise<ResolvedTenant | null> => {
  // prevent dashboard routes from being treated as tenants
  if (isReservedTenantSlug(slug)) {
    return null;
  }

  const defaults = {
    phone: '0000000000',
    whatsapp: '0000000000',
    services: [
      { name: 'Home Visit', description: 'On-site consultation and measurement.' },
      { name: 'Consultation', description: 'Guidance on styles, pricing, and timelines.' },
    ],
    products: ['Service'],
    gallery: [],
    sectionOrder: ['hero', 'services', 'gallery'],
    galleryCategories: ['gallery', 'before-after', 'team', 'workspace'],
    socialLinks: [],
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    fontFamily: DEFAULT_TENANT_FONT,
    logoShape: 'circle',
    actionButtons: DEFAULT_ACTION_BUTTONS,
  };

  const normalizeSectionOrder = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      const items = value.filter((entry): entry is string => typeof entry === 'string');
      return items.length > 0 ? items : defaults.sectionOrder;
    }

    if (value && typeof value === 'object') {
      const raw = value as Record<string, unknown>;
      if (Array.isArray(raw.sections)) {
        const items = raw.sections.filter((entry): entry is string => typeof entry === 'string');
        return items.length > 0 ? items : defaults.sectionOrder;
      }
    }

    return defaults.sectionOrder;
  };

  const normalizeGalleryCategories = (settings: Record<string, unknown>): string[] => {
    const direct = settings.galleryCategories;
    if (Array.isArray(direct)) {
      const items = direct.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
      );
      return items.length > 0 ? items : defaults.galleryCategories;
    }

    const sectionOrder = settings.sectionOrder;
    if (sectionOrder && typeof sectionOrder === 'object' && !Array.isArray(sectionOrder)) {
      const raw = sectionOrder as Record<string, unknown>;
      if (Array.isArray(raw.galleryCategories)) {
        const items = raw.galleryCategories.filter(
          (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
        );
        return items.length > 0 ? items : defaults.galleryCategories;
      }
    }

    return defaults.galleryCategories;
  };

  const toStringOr = (value: unknown, fallback?: string): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    return fallback;
  };

  const normalizeSettingsActionButtons = (
    settings: Record<string, unknown>,
  ): ActionButtonsConfig => {
    const direct = settings.actionButtons;

    if (direct && typeof direct === 'object') {
      return normalizeActionButtons(direct);
    }

    const sectionOrder = settings.sectionOrder;
    if (sectionOrder && typeof sectionOrder === 'object' && !Array.isArray(sectionOrder)) {
      const raw = sectionOrder as Record<string, unknown>;
      return normalizeActionButtons(raw.actionButtons);
    }

    return defaults.actionButtons;
  };

  const normalizeFontFamily = (settings: Record<string, unknown>): string => {
    const direct = settings.fontFamily;
    if (typeof direct === 'string' && direct.trim().length > 0) {
      return sanitizeTenantFontName(direct);
    }

    const sectionOrder = settings.sectionOrder;
    if (sectionOrder && typeof sectionOrder === 'object' && !Array.isArray(sectionOrder)) {
      const raw = sectionOrder as Record<string, unknown>;
      if (typeof raw.fontFamily === 'string' && raw.fontFamily.trim().length > 0) {
        return sanitizeTenantFontName(raw.fontFamily);
      }
    }

    return defaults.fontFamily;
  };

  const normalizeThemeKey = (settings: Record<string, unknown>): TenantThemeKey => {
    const direct = settings.theme ?? settings.themeKey;
    if (typeof direct === 'string' && direct.trim().length > 0) {
      return normalizeTenantThemeKey(direct);
    }

    const sectionOrder = settings.sectionOrder;
    if (sectionOrder && typeof sectionOrder === 'object' && !Array.isArray(sectionOrder)) {
      const raw = sectionOrder as Record<string, unknown>;
      return normalizeTenantThemeKey(raw.theme ?? raw.themeKey);
    }

    return 'default';
  };

  const normalizeServices = (value: unknown): Array<{ name: string; description?: string }> => {
    if (!Array.isArray(value)) {
      return defaults.services;
    }

    const normalized = value.reduce<Array<{ name: string; description?: string }>>(
      (items, entry) => {
        if (!entry || typeof entry !== 'object') {
          return items;
        }

        const item = entry as { name?: unknown; description?: unknown };
        if (typeof item.name !== 'string' || item.name.trim().length === 0) {
          return items;
        }

        items.push({
          name: item.name.trim(),
          description: typeof item.description === 'string' ? item.description : undefined,
        });

        return items;
      },
      [],
    );

    return normalized.length > 0 ? normalized : defaults.services;
  };

  const normalizeHour = (value: unknown, fallback: number): number => {
    if (typeof value === 'number' && Number.isInteger(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    }

    return fallback;
  };

  const normalizeAvailableHours = (value: unknown): number[] | undefined => {
    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => {
          if (typeof item === 'number' && Number.isInteger(item)) {
            return item;
          }
          if (typeof item === 'string') {
            const parsed = parseInt(item.trim(), 10);
            return Number.isNaN(parsed) ? undefined : parsed;
          }
          return undefined;
        })
        .filter((hour): hour is number => typeof hour === 'number');

      return normalized.length > 0 ? normalized : undefined;
    }

    if (typeof value === 'string') {
      const normalized = value
        .split(',')
        .map((item) => Number.parseInt(item.trim(), 10))
        .filter((hour) => !Number.isNaN(hour));

      return normalized.length > 0 ? normalized : undefined;
    }

    return undefined;
  };

  let sawNotFound = false;
  let lastError: Error | null = null;

  for (const apiBase of getApiBaseCandidates()) {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    try {
      const controller = new AbortController();
      timeoutHandle = globalThis.setTimeout(() => controller.abort(), 15000);

      const res = await fetchWithRetry(
        buildUpstreamApiUrl(apiBase, `/tenants/slug/${encodeURIComponent(slug)}`),
        {
          cache: 'no-store',
          signal: controller.signal,
        },
        {
          attempts: 2,
        },
      );

      if (res.status === 404) {
        sawNotFound = true;
        continue;
      }

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        lastError = new Error(
          `Tenant request failed with status ${res.status}` +
            (errorPayload?.message ? `: ${String(errorPayload.message)}` : ''),
        );
        continue;
      }

      const payload = await res.json();
      const tenant = payload?.data as TenantPublicPayload | undefined;

      if (!tenant) {
        continue;
      }

      // Prefer the canonical customization payload, but preserve legacy top-level theme values.
      const customization = (tenant.customization ?? {}) as Record<string, unknown>;
      const customizationTheme = normalizeThemeKey(customization);
      const legacyTheme =
        typeof tenant.theme === 'string' && tenant.theme.trim().length > 0
          ? normalizeTenantThemeKey(tenant.theme)
          : undefined;
      const theme =
        customizationTheme === 'default' && legacyTheme && legacyTheme !== 'default'
          ? legacyTheme
          : customizationTheme;

      return {
        ...defaults,
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain ?? undefined,
        phone: toStringOr(customization.businessPhone, defaults.phone),
        whatsapp: toStringOr(
          customization.businessWhatsApp,
          toStringOr(customization.businessPhone, defaults.whatsapp),
        ),
        tagline: toStringOr(customization.tagline),
        logoUrl: toStringOr(customization.logoUrl),
        bannerUrl: toStringOr(customization.bannerUrl),
        logoShape: toStringOr(customization.logoShape, defaults.logoShape),
        primaryColor: toStringOr(customization.primaryColor, defaults.primaryColor),
        secondaryColor: toStringOr(customization.secondaryColor, defaults.secondaryColor),
        fontFamily: normalizeFontFamily(customization),
        theme,
        themeKey: theme,
        sectionOrder: normalizeSectionOrder(customization.sectionOrder),
        galleryCategories: normalizeGalleryCategories(customization),
        actionButtons: normalizeSettingsActionButtons(customization),
        services: normalizeServices(tenant.services),
        gallery: Array.isArray(tenant.galleryImages)
          ? tenant.galleryImages.map((img) => ({
              url: img?.url,
              category: img?.category || 'general',
            }))
          : defaults.gallery,
        socialLinks: Array.isArray(tenant.socialLinks) ? tenant.socialLinks : defaults.socialLinks,
        openHour: normalizeHour(customization.openHour, DEFAULT_OPEN_HOUR),
        closeHour: normalizeHour(customization.closeHour, DEFAULT_CLOSE_HOUR),
        availableHours: normalizeAvailableHours(customization.availableHours),
      };
    } catch (error) {
      console.error(`Failed to fetch tenant from ${apiBase}: ${slug}`, error);
      lastError = error instanceof Error ? error : new Error('Failed to fetch tenant');
    } finally {
      if (timeoutHandle) {
        globalThis.clearTimeout(timeoutHandle);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
});
