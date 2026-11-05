'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';

import MarketingHeader from './components/marketing/MarketingHeader';
import HeroSection from './components/marketing/HeroSection';
import SolutionsSection from './components/marketing/SolutionsSection';
import PlatformSection from './components/marketing/PlatformSection';
import ProductShowcase from './components/marketing/ProductShowcase';
import BusinessValueSection from './components/marketing/BusinessValueSection';
import PricingSection from './components/marketing/PricingSection';
import DemoCTA from './components/marketing/DemoCTA';
import MarketingFooter from './components/marketing/MarketingFooter';

const LAST_TENANT_KEY = 'riselocal:last-tenant';

const MARKETING_WHATSAPP_HREF =
  'https://wa.me/919505180071?text=Hello%2C%20I%20would%20like%20to%20know%20more%20about%20RiseLocal.';

export default function HomePage() {
  const [tenantHint, setTenantHint] = useState<string | null>(null);

  // Preserve existing tenant detection and storage functionality.
  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const tenantFromQuery = params.get('tenant');
    const normalized = (tenantFromQuery ?? '').trim().toLowerCase();

    if (normalized) {
      setTenantHint(normalized);

      try {
        localStorage.setItem(LAST_TENANT_KEY, normalized);
      } catch {
        // Ignore storage failures.
      }

      return;
    }

    let fromStorage: string | null = null;

    try {
      fromStorage = localStorage.getItem(LAST_TENANT_KEY);
    } catch {
      fromStorage = null;
    }

    setTenantHint(
      fromStorage && fromStorage.trim().length > 0
        ? fromStorage.trim().toLowerCase()
        : null
    );
  }, []);

  // Preserve tenant-specific login URLs.
  const loginHref = useMemo(() => {
    if (!tenantHint) return '/login';

    return `/login?tenant=${encodeURIComponent(tenantHint)}`;
  }, [tenantHint]);

  return (
    <div id="top" className="marketing-page">
      <MarketingHeader loginHref={loginHref} />

      <main className="marketing-site">
        <HeroSection />
        <SolutionsSection />
        <PlatformSection />
        <ProductShowcase />
        <BusinessValueSection />
        <PricingSection />
        <DemoCTA />
      </main>

      <MarketingFooter />

      {/* Preserve the existing WhatsApp contact button. */}
      <a
        href={MARKETING_WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-[#1fb95a] sm:bottom-5 sm:right-5"
      >
        <MessageCircle className="h-5 w-5" />
        <span>Chat With Us</span>
      </a>
    </div>
  );
}
