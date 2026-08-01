import { buildBrowserApiUrl, buildUpstreamApiUrl, getApiBaseCandidates } from '@/lib/api-endpoint';
import { api } from '@/lib/api-client';
import { fetchWithRetry } from '@/lib/retry';

function buildApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return buildBrowserApiUrl(path);
  }

  return buildUpstreamApiUrl(getApiBaseCandidates()[0], path);
}

function handleUnauthorizedResponse(res: Response): void {
  if (res.status !== 401 || typeof window === 'undefined') return;

  let tenantSlug: string | null = null;
  try {
    tenantSlug = localStorage.getItem('tenantSlug');
    localStorage.removeItem('token');
  } catch {
    tenantSlug = null;
  }

  const loginPath = tenantSlug
    ? `/login?tenant=${encodeURIComponent(tenantSlug)}`
    : '/login';

  if (!globalThis.location.pathname.startsWith('/login')) {
    globalThis.location.assign(loginPath);
  }
}

async function parseApiResponse(res: Response): Promise<any> {
  handleUnauthorizedResponse(res);

  const text = await res.text();
  let payload: any = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    const startsWithHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
    if (startsWithHtml) {
      throw new Error('Server returned HTML instead of JSON. Please check API route/proxy configuration.');
    }
    throw new Error('Server returned an invalid JSON response.');
  }

  if (!res.ok) {
    const message =
      payload?.error || payload?.message || `Request failed with status ${res.status}`;
    throw new Error(String(message));
  }

  return payload;
}

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  let token: string | null = null;
  let tenantSlug: string | null = null;

  if (typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('token');
      tenantSlug = localStorage.getItem('tenantSlug');
    } catch {
      token = null;
      tenantSlug = null;
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (tenantSlug) {
    headers['x-tenant-slug'] = tenantSlug;
  }

  return headers;
}

export function getTenantApiClient() {
  return {
    async get(path: string) {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const res = await fetchWithRetry(buildApiUrl(normalizedPath), {
        headers: getAuthHeaders(),
      });
      return parseApiResponse(res);
    },

    async post(path: string, body: any, options?: { headers?: Record<string, string> }) {
      const isFormData = body instanceof FormData;
      const rawHeaders = isFormData
        ? { ...options?.headers }
        : { 'Content-Type': 'application/json', ...options?.headers };
      if (isFormData) {
        delete rawHeaders['Content-Type'];
      }
      const headers = getAuthHeaders(rawHeaders);
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;

      const res = await fetch(buildApiUrl(normalizedPath), {
        method: 'POST',
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });
      return parseApiResponse(res);
    },

    async put(path: string, body: any, options?: { headers?: Record<string, string> }) {
      const isFormData = body instanceof FormData;
      const rawHeaders = isFormData
        ? { ...options?.headers }
        : { 'Content-Type': 'application/json', ...options?.headers };
      if (isFormData) {
        delete rawHeaders['Content-Type'];
      }
      const headers = getAuthHeaders(rawHeaders);
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;

      const res = await fetch(buildApiUrl(normalizedPath), {
        method: 'PUT',
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });
      return parseApiResponse(res);
    },

    async delete(path: string) {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const res = await fetch(buildApiUrl(normalizedPath), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return parseApiResponse(res);
    },
  };
}

import type { TenantPublicPayload } from '@saas/domain-core/tenant.contract';

export type TenantRecord = Pick<
  TenantPublicPayload,
  'id' | 'name' | 'slug' | 'domain' | 'createdAt'
>;

export function toArrayPayload(data: unknown): any[] {
  const nested = (data as { data?: unknown })?.data;

  if (Array.isArray(nested)) {
    return nested;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

export function matchTenant(tenant: TenantRecord, tenantKey: string): boolean {
  const key = tenantKey.trim().toLowerCase();
  const id = String(tenant.id ?? '')
    .trim()
    .toLowerCase();
  const slug = String(tenant.slug ?? '')
    .trim()
    .toLowerCase();
  const domain = String(tenant.domain ?? '')
    .trim()
    .toLowerCase();

  return id === key || slug === key || domain === key;
}

export async function resolveTenant(tenantKey: string): Promise<TenantRecord | null> {
  if (!tenantKey) return null;

  try {
    const bySlugResponse = await api.get<{ success?: boolean; data?: TenantRecord }>(
      `/tenants/slug/${encodeURIComponent(tenantKey)}`,
    );

    if (bySlugResponse?.success && bySlugResponse.data) {
      const resolved = bySlugResponse.data;
      return {
        id: String(resolved.id ?? ''),
        name: resolved.name,
        slug: resolved.slug,
        domain: resolved.domain,
        createdAt: resolved.createdAt,
      };
    }
  } catch {
    // fallback to protected listing endpoint if slug route is unavailable
  }

  const response = await api.get('/tenants');
  const tenants = toArrayPayload(response) as TenantRecord[];
  const tenant = tenants.find((entry) => matchTenant(entry, tenantKey));
  return tenant ?? null;
}

export async function fetchLeadsForTenant(tenantKey: string): Promise<any[]> {
  const tenant = await resolveTenant(tenantKey).catch(() => null);

  const candidateKeys = [tenant?.slug, tenant?.id, tenantKey].filter(
    (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index,
  );

  let lastError = 'Tenant not found';

  for (const key of candidateKeys) {
    try {
      const leadsResponse = await api.get(`/tenant/${key}/leads`);

      if ((leadsResponse as { success?: boolean; message?: string })?.success === false) {
        lastError = (leadsResponse as { message?: string })?.message ?? 'Failed to fetch leads';
        continue;
      }

      const items = toArrayPayload(leadsResponse);

      if (items.length > 0 || (leadsResponse as { success?: boolean })?.success === true) {
        return items;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Failed to fetch leads';
    }
  }

  if (!candidateKeys.length) {
    throw new Error('Tenant not found');
  }

  throw new Error(lastError);
}

export async function fetchLeadAnalyticsForTenant(
  tenantKey: string,
  partition: 'week' | 'month' | 'quarter' | 'year' = 'week',
): Promise<Record<string, unknown> | null> {
  const tenant = await resolveTenant(tenantKey).catch(() => null);

  const candidateKeys = [tenant?.slug, tenant?.id, tenantKey].filter(
    (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index,
  );

  for (const key of candidateKeys) {
    try {
      const analyticsResponse = await api.get(`/tenant/${key}/leads/analytics?partition=${partition}`);

      if ((analyticsResponse as { success?: boolean })?.success === false) {
        continue;
      }

      if ((analyticsResponse as { data?: unknown })?.data) {
        const payload = (analyticsResponse as { data: unknown }).data;
        if (payload && typeof payload === 'object') {
          return payload as Record<string, unknown>;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function fetchFeedbackForTenant(tenantKey: string): Promise<any[]> {
  const tenant = await resolveTenant(tenantKey).catch(() => null);

  const candidateKeys = [tenant?.slug, tenant?.id, tenantKey].filter(
    (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index,
  );

  for (const key of candidateKeys) {
    try {
      const feedbackResponse = await api.get(`/tenant/${key}/feedback`);

      if ((feedbackResponse as { success?: boolean })?.success === false) {
        continue;
      }

      const items = toArrayPayload(feedbackResponse);

      if (items.length > 0 || (feedbackResponse as { success?: boolean })?.success === true) {
        return items;
      }
    } catch {
      continue;
    }
  }

  return [];
}

export async function fetchTenantSettingsForTenant(tenantKey: string): Promise<Record<string, unknown> | null> {
  const tenant = await resolveTenant(tenantKey).catch(() => null);

  const candidateKeys = [tenant?.slug, tenant?.id, tenantKey].filter(
    (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index,
  );

  for (const key of candidateKeys) {
    try {
      const response = await api.get(`/tenant/${key}/settings`);

      if ((response as { success?: boolean })?.success === false) {
        continue;
      }

      const data = (response as { data?: unknown })?.data;
      if (data && typeof data === 'object') {
        return data as Record<string, unknown>;
      }
    } catch {
      continue;
    }
  }

  return null;
}
