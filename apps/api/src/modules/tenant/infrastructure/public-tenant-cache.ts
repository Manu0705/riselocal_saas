import { prisma } from '@saas/database';

type CachedTenant = {
  data: unknown;
  expiresAt: number;
};

const tenantCache = new Map<string, CachedTenant>();

export function getPublicTenantCache(slug: string): unknown | null {
  const key = slug.trim().toLowerCase();
  const cached = tenantCache.get(key);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  tenantCache.delete(key);
  return null;
}

export function setPublicTenantCache(slug: string, data: unknown, ttlMs = 60000): void {
  const key = slug.trim().toLowerCase();

  tenantCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidatePublicTenantCacheBySlug(slug?: string | null): void {
  if (!slug) return;
  tenantCache.delete(slug.trim().toLowerCase());
}

export async function invalidatePublicTenantCacheByTenantId(tenantId?: string | null): Promise<void> {
  if (!tenantId) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true },
  });

  if (!tenant?.slug) return;
  invalidatePublicTenantCacheBySlug(tenant.slug);
}

export function clearPublicTenantCache(): void {
  tenantCache.clear();
}
