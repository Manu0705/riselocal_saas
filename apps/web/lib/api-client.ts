import { buildBrowserApiUrl, buildUpstreamApiUrl, getApiBaseCandidates } from '@/lib/api-endpoint';

function buildUrl(path: string) {
  if (globalThis.window !== undefined) {
    return buildBrowserApiUrl(path);
  }

  return buildUpstreamApiUrl(getApiBaseCandidates()[0], path);
}

function handleUnauthorizedResponse(res: Response): void {
  if (res.status !== 401 || globalThis.window === undefined) return;

  const tenantSlug = getStoredTenantSlug();
  localStorage.removeItem('token');

  const loginPath = tenantSlug
    ? `/login?tenant=${encodeURIComponent(tenantSlug)}`
    : '/login';

  if (!globalThis.location.pathname.startsWith('/login')) {
    globalThis.location.assign(loginPath);
  }
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  handleUnauthorizedResponse(res);

  const text = await res.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('API did not return JSON: ' + text.slice(0, 100));
  }
}

function getStoredTenantSlug(): string | null {
  if (globalThis.window === undefined) return null;
  const value = globalThis.localStorage.getItem('tenantSlug');
  return value && value.trim().length > 0 ? value.trim().toLowerCase() : null;
}

function withTenantQuery(path: string): string {
  const slug = getStoredTenantSlug();
  if (!slug) return path;

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}tenantSlug=${encodeURIComponent(slug)}`;
}

function buildAuthHeaders(includeJson = false): Record<string, string> {
  const token = (globalThis.window !== undefined && localStorage.getItem('token')) || null;
  const tenantSlug = getStoredTenantSlug();

  const headers: Record<string, string> = {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
  };

  return headers;
}

export const api = {
  async get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(buildUrl(withTenantQuery(path)), {
      headers: buildAuthHeaders(),
    });

    return parseJsonResponse<T>(res);
  },

  async post<TResponse = unknown, TBody = unknown>(path: string, data: TBody): Promise<TResponse> {
    const res = await fetch(buildUrl(withTenantQuery(path)), {
      method: 'POST',
      headers: buildAuthHeaders(true),
      body: JSON.stringify(data),
    });

    return parseJsonResponse<TResponse>(res);
  },

  async patch<TResponse = unknown, TBody = unknown>(
    path: string,
    data?: TBody,
  ): Promise<TResponse> {
    const headers: Record<string, string> = buildAuthHeaders();

    let body: string | undefined;
    if (data !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const res = await fetch(buildUrl(withTenantQuery(path)), {
      method: 'PATCH',
      headers,
      body,
    });

    return parseJsonResponse<TResponse>(res);
  },
};
