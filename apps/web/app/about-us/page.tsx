import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Globe2, UsersRound, Workflow } from 'lucide-react';
import { CorporatePageHero, CorporatePageLayout } from '../components/CorporatePageLayout';

export const metadata: Metadata = {
  title: 'About Riselocal',
  description:
    'Learn about Riselocal, a connected platform for business presence, customer management and operations.',
};

const platformAreas = [
  {
    title: 'Online presence',
    description:
      'Give customers a clear place to learn about your business, services and ways to get in touch.',
    icon: Globe2,
  },
  {
    title: 'Customer relationships',
    description: 'Keep enquiries, customer information and follow-up activity easier to organise.',
    icon: UsersRound,
  },
  {
    title: 'Business operations',
    description: 'Bring everyday work and industry-focused workflows into a connected workspace.',
    icon: Workflow,
  },
];

const workflow = [
  'Present your business and services',
  'Keep enquiries and customer details organised',
  'Coordinate follow-ups and daily activities',
  'Use industry-focused capabilities where they fit',
];

export default function AboutUsPage() {
  return (
    <CorporatePageLayout>
      <CorporatePageHero
        eyebrow="ABOUT RISELOCAL"
        title="A more connected way to manage everyday business."
        description="Riselocal brings online presence, customer relationships and business operations together in one platform, with workflows for different kinds of businesses."
        image={{
          src: '/images/marketing/platform-illustration.svg',
          alt: 'Illustration of business presence, customers and operations in one workspace',
          caption: 'Connecting the everyday parts of a business',
        }}
      >
        <Link className="corp-button" href="/platform">
          Explore the platform <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link className="corp-button corp-button--secondary" href="/book-demo">
          Talk with our team
        </Link>
      </CorporatePageHero>

      <section className="corp-section corp-section--white">
        <div className="corp-container">
          <div className="corp-section-heading">
            <p className="corp-eyebrow">WHAT WE BRING TOGETHER</p>
            <h2>One platform for the work around your business.</h2>
            <p>
              Business information, customer conversations and daily operations are connected
              through Riselocal’s common platform.
            </p>
          </div>
          <div className="corp-grid corp-grid--3">
            {platformAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article className="corp-card" key={area.title}>
                  <div className="corp-card__icon">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="corp-section">
        <div className="corp-container">
          <div className="corp-section-heading">
            <p className="corp-eyebrow">HOW THE PLATFORM FITS TOGETHER</p>
            <h2>From first interaction to everyday work.</h2>
          </div>
          <div className="corp-grid corp-grid--4">
            {workflow.map((step, index) => (
              <article className="corp-card" key={step}>
                <span className="corp-step-number">STEP {String(index + 1).padStart(2, '0')}</span>
                <h3>{step}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="corp-section corp-section--white">
        <div className="corp-container">
          <div className="corp-banner">
            <div>
              <h2>Find the right starting point for your business.</h2>
              <p>Explore the platform or speak with our team about your requirements.</p>
            </div>
            <Link className="corp-button" href="/solutions">
              Explore solutions <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </CorporatePageLayout>
  );
}
