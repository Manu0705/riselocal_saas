'use client';

import { useTenantFont } from '@/lib/use-tenant-font';

type Props = {
  fontName?: string;
  children: React.ReactNode;
};

export default function TenantFontScope({ fontName, children }: Readonly<Props>) {
  const { style } = useTenantFont(fontName);

  return <div style={style}>{children}</div>;
}
