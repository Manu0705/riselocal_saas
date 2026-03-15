'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RequireAuth({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, tenantSlug, hydrated, setTenant } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) return;

    const queryTenant = searchParams.get('tenant');

    // If URL has tenant query and it's different from stored, update stored
    if (queryTenant && queryTenant !== tenantSlug) {
      setTenant(queryTenant);
      return;
    }

    // If no tenant in URL or stored, default to "default"
    if (!queryTenant && !tenantSlug) {
      setTenant('default');
      return;
    }

    // If authenticated with tenant but URL doesn't have it, add to URL
    if (!queryTenant && tenantSlug) {
      router.replace(`/dashboard?tenant=${tenantSlug}`);
    }
  }, [hydrated, isAuthenticated, searchParams, tenantSlug, setTenant, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated) return;

    const tenant = searchParams.get('tenant') ?? tenantSlug;
    const query = tenant ? `?tenant=${tenant}` : '';

    router.replace(`/login${query}`);
  }, [hydrated, isAuthenticated, router, searchParams, tenantSlug]);

  return <>{children}</>;
}
