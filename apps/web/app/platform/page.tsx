import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import BusinessValueSection from '../components/marketing/BusinessValueSection';
import DemoCTA from '../components/marketing/DemoCTA';
import PlatformSection from '../components/marketing/PlatformSection';
import { CorporatePageHero, CorporatePageLayout } from '../components/CorporatePageLayout';

export const metadata: Metadata = {
  title: 'Platform',
  description:
    'Explore how Riselocal connects your online presence, customer management and business operations.',
};

const productCapabilities = [
  {
    title: 'Public business presence',
    description:
      'Share business information, services and contact options in a customer-facing online presence.',
  },
  {
    title: 'Enquiry and customer workflows',
    description: 'Keep incoming enquiries, customer information and follow-up activity organised.',
  },
  {
    title: 'Industry-focused operations',
    description:
      'Use workflows suited to different business needs, from hostel operations to dining activities.',
  },
];

export default function PlatformPage() {
  return (
    <CorporatePageLayout>
      <CorporatePageHero
        eyebrow="THE RISELOCAL PLATFORM"
        title="Your online presence, customers and operations — connected."
        description="Riselocal brings essential business workflows into one platform, with common capabilities and industry-focused tools working side by side."
        image={{
          src: '/images/marketing/platform-illustration.svg',
          alt: 'Illustration of the Riselocal platform connecting business workflows',
          caption: 'An illustrative view of connected business workflows',
        }}
      >
        <Link className="corp-button" href="/book-demo">
          Book a demo <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link className="corp-button corp-button--secondary" href="/solutions">
          Explore solutions
        </Link>
      </CorporatePageHero>

      <PlatformSection />

      <section className="corp-section corp-section--white" id="features">
        <div className="corp-container">
          <div className="corp-section-heading">
            <p className="corp-eyebrow">PRODUCT CAPABILITIES</p>
            <h2>One platform for the work around your business.</h2>
            <p>
              Explore the connected capabilities available across the platform and its industry
              solutions.
            </p>
          </div>
          <div className="corp-grid corp-grid--3">
            {productCapabilities.map((capability) => (
              <article className="corp-card" key={capability.title}>
                <div className="corp-card__icon">
                  <CheckCircle2 size={22} aria-hidden="true" />
                </div>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <BusinessValueSection />
      <DemoCTA />
    </CorporatePageLayout>
  );
}
