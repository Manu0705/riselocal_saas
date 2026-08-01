/**
 * Canonical auth role contract — matches runtime JWT / TenantUser roles.
 */

export const AUTH_ROLES = ['owner', 'manager', 'staff', 'admin', 'super_admin'] as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

export const TENANT_USER_ROLES = ['owner', 'manager', 'staff'] as const;
export type TenantUserRole = (typeof TENANT_USER_ROLES)[number];

export const ADMIN_ROLES = ['admin', 'super_admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

const AUTH_ROLE_SET = new Set<string>(AUTH_ROLES);
const TENANT_USER_ROLE_SET = new Set<string>(TENANT_USER_ROLES);
const ADMIN_ROLE_SET = new Set<string>(ADMIN_ROLES);

export type AuthUser = {
  id: string;
  tenantId: string | null;
  role: AuthRole;
};

export function normalizeAuthRole(value: unknown, fallback: AuthRole = 'staff'): AuthRole {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return AUTH_ROLE_SET.has(normalized) ? (normalized as AuthRole) : fallback;
}

export function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === 'string' && AUTH_ROLE_SET.has(value);
}

export function isTenantUserRole(value: unknown): value is TenantUserRole {
  return typeof value === 'string' && TENANT_USER_ROLE_SET.has(value);
}

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && ADMIN_ROLE_SET.has(value.trim().toLowerCase());
}

export function normalizeTenantUserRole(
  value: unknown,
  fallback: TenantUserRole = 'owner',
): TenantUserRole {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return TENANT_USER_ROLE_SET.has(normalized) ? (normalized as TenantUserRole) : fallback;
}
