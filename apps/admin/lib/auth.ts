const DEFAULT_API_BASE = 'https://api.riselocal.in';
const API_BASE =
  process.env.NEXT_PUBLIC_API || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE;

function buildAuthUrl(path: string) {
  const base = API_BASE.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseHasApi = base.toLowerCase().endsWith('/api');
  const pathHasApi = normalizedPath.toLowerCase().startsWith('/api');
  const apiPrefix = baseHasApi ? '' : '/api';
  const finalPath = pathHasApi ? normalizedPath : `${apiPrefix}${normalizedPath}`;
  return `${base}${finalPath}`;
}

export function getAdminToken(): string | null {
  if (globalThis.window === undefined) return null;
  return localStorage.getItem('admin_token');
}

export function isAuthenticated(): boolean {
  return Boolean(getAdminToken());
}

export async function login(password: string): Promise<boolean> {
  let res: Response;

  try {
    res = await fetch(buildAuthUrl('/auth/admin-login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@riselocal.in',
        password,
      }),
    });
  } catch (error) {
    console.error('Admin login request failed', error);
    return false;
  }

  if (!res.ok) {
    return false;
  }

  const payload = await res.json();
  // Canonical envelope: { success: true, data: { token, user } }
  const token =
    (typeof payload?.data?.token === 'string' && payload.data.token) ||
    (typeof payload?.token === 'string' && payload.token) ||
    null;

  if (!token) {
    return false;
  }

  localStorage.setItem('admin_token', token);
  return true;
}

export function logout(): void {
  localStorage.removeItem('admin_token');
}
