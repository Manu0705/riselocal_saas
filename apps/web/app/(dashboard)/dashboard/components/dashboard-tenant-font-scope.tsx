'use client';

import { useEffect, useState } from 'react';
import { fetchTenantSettingsForTenant } from '@/lib/tenant-client';
import { useTenantFont } from '@/lib/use-tenant-font';
import { useAuth } from '@/context/AuthContext';

const fontByTenant = new Map<string, string>();

function extractFontFamily(settings: Record<string, unknown> | null): string | undefined {
  if (!settings) return undefined;

  const direct = settings.fontFamily;
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct;
  }

  const sectionOrder = settings.sectionOrder;
  if (sectionOrder && typeof sectionOrder === 'object' && !Array.isArray(sectionOrder)) {
    const nested = (sectionOrder as Record<string, unknown>).fontFamily;
    if (typeof nested === 'string' && nested.trim().length > 0) {
      return nested;
    }
  }

  return undefined;
}

type Props = {
  children: React.ReactNode;
};

export default function DashboardTenantFontScope({ children }: Readonly<Props>) {
  const { tenantSlug } = useAuth();
  const [fontName, setFontName] = useState<string | undefined>(undefined);

  useEffect(() => {
    const key = String(tenantSlug ?? '').trim().toLowerCase();
    if (!key) {
      setFontName(undefined);
      return;
    }

    const cachedFont = fontByTenant.get(key);
    if (cachedFont) {
      setFontName(cachedFont);
      return;
    }

    let cancelled = false;

    fetchTenantSettingsForTenant(key)
      .then((settings) => {
        if (cancelled) return;
        const nextFont = extractFontFamily(settings);
        if (!nextFont) return;

        fontByTenant.set(key, nextFont);
        setFontName(nextFont);
      })
      .catch(() => {
        if (!cancelled) {
          setFontName(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const { style } = useTenantFont(fontName);

  return <div style={style}>{children}</div>;
}
