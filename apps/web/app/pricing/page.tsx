import type { Metadata } from 'next';
import DemoCTA from '../components/marketing/DemoCTA';
import PricingSection from '../components/marketing/PricingSection';
import { CorporatePageHero, CorporatePageLayout } from '../components/CorporatePageLayout';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Learn about the Riselocal common subscription model and optional industry modules.',
};

export default function PricingPage() {
  return (
    <CorporatePageLayout>
      <CorporatePageHero
        eyebrow="PRICING"
        title="A common platform, with modules for your needs."
        description="Riselocal is based on a common platform subscription, with optional industry modules. Pricing details depend on your requirements and are shared by our team."
        image={{
          src: '/images/marketing/platform-illustration.svg',
          alt: 'Illustration of Riselocal platform capabilities and modules',
          caption: 'A shared platform, with optional industry workflows',
        }}
      />
      <PricingSection />
      <DemoCTA />
    </CorporatePageLayout>
  );
}
