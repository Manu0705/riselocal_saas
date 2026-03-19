'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type Props = {
  children: React.ReactNode;
};

export default function TenantPageWrapper({ children }: Props) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      // Wait for DOM to be fully rendered
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [searchParams]);

  return <>{children}</>;
}
