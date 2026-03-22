'use client';

import { useEffect, useMemo } from 'react';
import {
  getFontFamily,
  loadTenantGoogleFont,
  sanitizeTenantFontName,
  type TenantFontName,
} from '@/lib/tenant-font';

export function useTenantFont(fontName?: string | null): {
  resolvedFontName: TenantFontName;
  style: React.CSSProperties;
} {
  const resolvedFontName = useMemo(() => sanitizeTenantFontName(fontName), [fontName]);

  useEffect(() => {
    void loadTenantGoogleFont(resolvedFontName);
  }, [resolvedFontName]);

  const style = useMemo<React.CSSProperties>(
    () => ({
      fontFamily: getFontFamily(resolvedFontName),
      ['--tenant-font' as string]: getFontFamily(resolvedFontName),
    }),
    [resolvedFontName],
  );

  return {
    resolvedFontName,
    style,
  };
}
