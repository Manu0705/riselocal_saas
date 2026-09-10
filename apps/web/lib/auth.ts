import { buildBrowserApiUrl, buildUpstreamApiUrl, getApiBaseCandidates } from '@/lib/api-endpoint';
import { fetchWithRetry } from '@/lib/retry';

const TOKEN_KEY = 'token';
const TENANT_SLUG_KEY = 'tenantSlug';
const USER_NAME_KEY = 'userName';
const USER_ROLE_KEY = 'userRole';

function hasBrowserWindow(): boolean {
  return typeof window !== 'undefined';
}

function readStorageItem(key: string): string | null {
  if (!hasBrowserWindow()) return null;

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, value: string): void {
  if (!hasBrowserWindow()) return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore transient storage write failures (mobile restore/private modes).
  }
}

function removeStorageItem(key: string): void {
  if (!hasBrowserWindow()) return;

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore transient storage removal failures (mobile restore/private modes).
  }
}

function buildUrl(path: string) {
  if (hasBrowserWindow()) {
    return buildBrowserApiUrl(path);
  }

  return buildUpstreamApiUrl(getApiBaseCandidates()[0], path);
}

export type LoginUser = {
  name?: string;
  tenantSlug?: string;
  tenantId?: string;
  email?: string;
  role?: string;
};

export type LoginResult = {
  success?: boolean;
  token?: string;
  user?: LoginUser;
  error?: string;
  message?: string;
};

type LoginEnvelope = {
  success?: boolean;
  data?: {
    token?: string;
    user?: LoginUser;
  };
  token?: string;
  user?: LoginUser;
  error?: string;
  message?: string;
};

function normalizeLoginPayload(payload: LoginEnvelope | null): LoginResult {
  if (!payload) {
    return {};
  }

  if (payload.success === false) {
    return {
      success: false,
      message: payload.message || payload.error || 'Login failed',
      error: payload.message || payload.error || 'Login failed',
    };
  }

  const token = payload.data?.token ?? payload.token;
  const user = payload.data?.user ?? payload.user;

  if (token) {
    return {
      success: true,
      token,
      user,
    };
  }

  return {
    success: payload.success,
    message: payload.message || payload.error,
    error: payload.error || payload.message,
    token,
    user,
  };
}

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

  let raw: LoginEnvelope | null = null;
  try {
    raw = text ? (JSON.parse(text) as LoginEnvelope) : null;
  } catch {
    const snippet = text.slice(0, 120).toLowerCase();
    const looksLikeHtml = snippet.includes('<!doctype') || snippet.includes('<html');
    if (looksLikeHtml) {
      throw new Error('Server returned HTML instead of JSON during login. Please retry in a few seconds.');
    }

    throw new Error('Server returned invalid response during login. Please retry in a few seconds.');
  }

  const data = normalizeLoginPayload(raw);

  if (!res.ok || data.success === false) {
    const message = data.message || data.error || `Login failed with status ${res.status}`;
    return { success: false, error: message, message } as LoginResult;
  }

  return data;
}

function shouldRetryLoginWithUpstream(data: LoginResult | null): boolean {
  const message = String(data?.error || data?.message || '').toLowerCase();
  return message.includes('html instead of json') || message.includes('invalid response');
}

function shouldRetryLoginFromError(error: unknown): boolean {
  let message = '';

  if (error instanceof Error) {
    message = error.message.toLowerCase();
  } else if (typeof error === 'string') {
    message = error.toLowerCase();
  }

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
      if (!result?.error && result?.token) {
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
    let data: LoginResult;

    try {
      data = await requestLogin(buildUrl('/auth/login'), payload);
    } catch (primaryError) {
      if (hasBrowserWindow() && shouldRetryLoginFromError(primaryError)) {
        data = await retryLoginViaUpstream(payload);
      } else {
        throw primaryError;
      }
    }

    if (hasBrowserWindow() && shouldRetryLoginWithUpstream(data)) {
      data = await retryLoginViaUpstream(payload);
    }

    if (data?.token) {
      writeStorageItem(TOKEN_KEY, data.token);
    }

    if (typeof data?.user?.name === 'string' && data.user.name.trim().length > 0) {
      writeStorageItem(USER_NAME_KEY, data.user.name.trim());
    }

    return data;
  } catch (error) {
    console.error('auth.login failed', error);
    return { error: (error as Error).message || 'Failed to reach auth server' };
  }
}

export function getToken() {
  return readStorageItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function setTenantSlug(slug: string) {
  writeStorageItem(TENANT_SLUG_KEY, slug);
}

export function getTenantSlug() {
  return readStorageItem(TENANT_SLUG_KEY);
}

export function setUserName(name: string) {
  writeStorageItem(USER_NAME_KEY, name);
}

export function getUserName() {
  return readStorageItem(USER_NAME_KEY);
}

export function setUserRole(role: string) {
  writeStorageItem(USER_ROLE_KEY, role);
}

export function getUserRole() {
  return readStorageItem(USER_ROLE_KEY);
}

export function clearAuth() {
  removeStorageItem(TOKEN_KEY);
  removeStorageItem(TENANT_SLUG_KEY);
  removeStorageItem(USER_NAME_KEY);
  removeStorageItem(USER_ROLE_KEY);
}
