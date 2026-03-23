import { buildBrowserApiUrl, buildUpstreamApiUrl, getApiBaseCandidates } from '@/lib/api-endpoint';
import { fetchWithRetry } from '@/lib/retry';

const TOKEN_KEY = 'token';
const TENANT_SLUG_KEY = 'tenantSlug';
const USER_NAME_KEY = 'userName';

function hasBrowserWindow(): boolean {
  return globalThis.window !== undefined;
}

function buildUrl(path: string) {
  if (hasBrowserWindow()) {
    return buildBrowserApiUrl(path);
  }

  return buildUpstreamApiUrl(getApiBaseCandidates()[0], path);
}

type LoginResult = {
  token?: string;
  user?: {
    name?: string;
  };
  error?: string;
  message?: string;
};

async function requestLogin(url: string, payload: { email: string; password: string; tenantSlug?: string }) {
  const res = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      attempts: 7,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      factor: 1.6,
    },
  );

  const text = await res.text();

  let data: LoginResult | null = null;
  try {
    data = text ? (JSON.parse(text) as LoginResult) : null;
  } catch {
    const snippet = text.slice(0, 120).toLowerCase();
    const looksLikeHtml = snippet.includes('<!doctype') || snippet.includes('<html');
    if (looksLikeHtml) {
      throw new Error('Server returned HTML instead of JSON during login. Please retry in a few seconds.');
    }

    throw new Error('Server returned invalid response during login. Please retry in a few seconds.');
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `Login failed with status ${res.status}`;
    return { error: message } as LoginResult;
  }

  return data || ({} as LoginResult);
}

function shouldRetryLoginWithUpstream(data: LoginResult | null): boolean {
  const message = String(data?.error || data?.message || '').toLowerCase();
  return message.includes('html instead of json') || message.includes('invalid response');
}

async function retryLoginViaUpstream(payload: {
  email: string;
  password: string;
  tenantSlug?: string;
}): Promise<LoginResult> {
  for (const base of getApiBaseCandidates()) {
    const fallbackUrl = buildUpstreamApiUrl(base, '/auth/login');
    try {
      const result = await requestLogin(fallbackUrl, payload);
      if (!result?.error) {
        return result;
      }
    } catch {
      continue;
    }
  }

  return { error: 'Server returned invalid response during login. Please retry in a few seconds.' };
}

export async function login(email: string, password: string, tenantSlug?: string) {
  try {
    const payload = { email, password, tenantSlug };
    let data = await requestLogin(buildUrl('/auth/login'), payload);

    if (hasBrowserWindow() && shouldRetryLoginWithUpstream(data)) {
      data = await retryLoginViaUpstream(payload);
    }

    if (data?.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }

    if (typeof data?.user?.name === 'string' && data.user.name.trim().length > 0) {
      localStorage.setItem(USER_NAME_KEY, data.user.name.trim());
    }

    return data;
  } catch (error) {
    console.error('auth.login failed', error);
    return { error: (error as Error).message || 'Failed to reach auth server' };
  }
}

export function getToken() {
  if (!hasBrowserWindow()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function setTenantSlug(slug: string) {
  if (!hasBrowserWindow()) return;
  localStorage.setItem(TENANT_SLUG_KEY, slug);
}

export function getTenantSlug() {
  if (!hasBrowserWindow()) return null;
  return localStorage.getItem(TENANT_SLUG_KEY);
}

export function setUserName(name: string) {
  if (!hasBrowserWindow()) return;
  localStorage.setItem(USER_NAME_KEY, name);
}

export function getUserName() {
  if (!hasBrowserWindow()) return null;
  return localStorage.getItem(USER_NAME_KEY);
}

export function clearAuth() {
  if (!hasBrowserWindow()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_SLUG_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}
