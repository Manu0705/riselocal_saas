export const TENANT_FONT_OPTIONS = [
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
  'DM Sans',
  'Montserrat',
  'Lato',
  'Work Sans',
  'Nunito',
  'Source Sans 3',
] as const;

export type TenantFontName = (typeof TENANT_FONT_OPTIONS)[number];

export const DEFAULT_TENANT_FONT: TenantFontName = 'Inter';

const FONT_STACKS: Record<TenantFontName, string> = {
  Inter: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Poppins: "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Roboto: "Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  'Open Sans': "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  'DM Sans': "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Montserrat: "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Lato: "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  'Work Sans': "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Nunito: "Nunito, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  'Source Sans 3': "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const GOOGLE_FONT_FAMILIES: Record<TenantFontName, string> = {
  Inter: 'Inter:wght@400;500;600;700',
  Poppins: 'Poppins:wght@400;500;600;700',
  Roboto: 'Roboto:wght@400;500;700',
  'Open Sans': 'Open+Sans:wght@400;500;600;700',
  'DM Sans': 'DM+Sans:wght@400;500;700',
  Montserrat: 'Montserrat:wght@400;500;600;700',
  Lato: 'Lato:wght@400;700',
  'Work Sans': 'Work+Sans:wght@400;500;600;700',
  Nunito: 'Nunito:wght@400;500;600;700',
  'Source Sans 3': 'Source+Sans+3:wght@400;500;600;700',
};

const loadedFontNames = new Set<TenantFontName>();
const loadingFontPromises = new Map<TenantFontName, Promise<void>>();

export function sanitizeTenantFontName(value: unknown): TenantFontName {
  if (typeof value !== 'string') {
    return DEFAULT_TENANT_FONT;
  }

  const normalized = value.trim().toLowerCase();
  const matched = TENANT_FONT_OPTIONS.find((font) => font.toLowerCase() === normalized);
  return matched ?? DEFAULT_TENANT_FONT;
}

export function getFontFamily(fontName?: string | null): string {
  const normalized = sanitizeTenantFontName(fontName);
  return FONT_STACKS[normalized];
}

export function getGoogleFontHref(fontName?: string | null): string {
  const normalized = sanitizeTenantFontName(fontName);
  return `https://fonts.googleapis.com/css2?family=${GOOGLE_FONT_FAMILIES[normalized]}&display=swap`;
}

export function loadTenantGoogleFont(fontName?: string | null): Promise<void> {
  if (globalThis.document === undefined) {
    return Promise.resolve();
  }

  const normalized = sanitizeTenantFontName(fontName);
  if (loadedFontNames.has(normalized)) {
    return Promise.resolve();
  }

  const existingPromise = loadingFontPromises.get(normalized);
  if (existingPromise) {
    return existingPromise;
  }

  const linkId = `tenant-font-${normalized.toLowerCase().replace(/\s+/g, '-')}`;
  const existingLink = globalThis.document.getElementById(linkId) as HTMLLinkElement | null;

  if (existingLink) {
    loadedFontNames.add(normalized);
    return Promise.resolve();
  }

  const href = getGoogleFontHref(normalized);
  const link = globalThis.document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = href;

  const promise = new Promise<void>((resolve) => {
    const done = () => {
      loadedFontNames.add(normalized);
      loadingFontPromises.delete(normalized);
      resolve();
    };

    link.onload = () => done();
    link.onerror = () => done();
    globalThis.document.head.appendChild(link);
  });

  loadingFontPromises.set(normalized, promise);
  return promise;
}
