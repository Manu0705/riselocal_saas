import { buildBrowserApiUrl, buildUpstreamApiUrl, getApiBaseCandidates } from '@/lib/api-endpoint';

const TOKEN_KEY = 'token';
const TENANT_SLUG_KEY = 'tenantSlug';
const USER_NAME_KEY = 'userName';

function buildUrl(path: string) {
  if (typeof window !== 'undefined') {
    return buildBrowserApiUrl(path);
  }

  return buildUpstreamApiUrl(getApiBaseCandidates()[0], path);
}

export async function login(email: string, password: string, tenantSlug?: string) {
  try {
    const res = await fetch(buildUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, tenantSlug }),
    });

    const data = await res.json();

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
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function setTenantSlug(slug: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TENANT_SLUG_KEY, slug);
}

export function getTenantSlug() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TENANT_SLUG_KEY);
}

export function setUserName(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_NAME_KEY, name);
}

export function getUserName() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_NAME_KEY);
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_SLUG_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}
