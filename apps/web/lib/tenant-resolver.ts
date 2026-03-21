import { buildUpstreamApiUrl, getApiBaseCandidates } from '@/lib/api-endpoint';
import { DEFAULT_ACTION_BUTTONS, normalizeActionButtons, type ActionButtonsConfig } from '@/lib/action-buttons';
import { fetchWithRetry } from '@/lib/retry';
import { cache } from 'react';

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

type ResolvedTenant = {
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
  sectionOrder?: string[];
  galleryCategories?: string[];
  actionButtons?: ActionButtonsConfig;
  services?: Array<{ name: string; description?: string }>;
  gallery?: Array<{ url: string; category: string }>;
  socialLinks?: Array<{ platform?: string; url?: string; label?: string }>;
  products?: string[];
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

  const normalizeSettingsActionButtons = (settings: Record<string, unknown>): ActionButtonsConfig => {
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

  const normalizeServices = (value: unknown): Array<{ name: string; description?: string }> => {
    if (!Array.isArray(value)) {
      return defaults.services;
    }

    const normalized = value.reduce<Array<{ name: string; description?: string }>>((items, entry) => {
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
    }, []);

    return normalized.length > 0 ? normalized : defaults.services;
  };

  let sawNotFound = false;
  let lastError: Error | null = null;

  for (const apiBase of getApiBaseCandidates()) {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    try {
      const controller = new AbortController();
      timeoutHandle = globalThis.setTimeout(() => controller.abort(), 1200);

      const res = await fetchWithRetry(
        buildUpstreamApiUrl(apiBase, `/tenants/slug/${encodeURIComponent(slug)}`),
        {
          cache: 'force-cache',
          next: { revalidate: 60 },
          signal: controller.signal,
        },
        {
          attempts: 1,
        },
      );

      if (res.status === 404) {
        sawNotFound = true;
        continue;
      }

      if (!res.ok) {
        lastError = new Error(`Tenant request failed with status ${res.status}`);
        continue;
      }

      const payload = await res.json();
      const tenant = payload?.data;

      if (!tenant) {
        continue;
      }

      const settings = (tenant.settings ?? {}) as Record<string, unknown>;

      return {
        ...defaults,
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        phone: toStringOr(settings.businessPhone, defaults.phone),
        whatsapp: toStringOr(settings.businessWhatsApp, toStringOr(settings.businessPhone, defaults.whatsapp)),
        tagline: toStringOr(settings.tagline),
        logoUrl: toStringOr(settings.logoUrl),
        bannerUrl: toStringOr(settings.bannerUrl),
        logoShape: toStringOr(settings.logoShape, defaults.logoShape),
        primaryColor: toStringOr(settings.primaryColor, defaults.primaryColor),
        secondaryColor: toStringOr(settings.secondaryColor, defaults.secondaryColor),
        sectionOrder: normalizeSectionOrder(settings.sectionOrder),
        galleryCategories: normalizeGalleryCategories(settings),
        actionButtons: normalizeSettingsActionButtons(settings),
        services: normalizeServices(tenant.services),
        gallery: Array.isArray(tenant.galleryImages) ? tenant.galleryImages : defaults.gallery,
        socialLinks: Array.isArray(tenant.socialLinks) ? tenant.socialLinks : defaults.socialLinks,
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

  if (lastError && !sawNotFound) {
    throw lastError;
  }

  return null;
});
