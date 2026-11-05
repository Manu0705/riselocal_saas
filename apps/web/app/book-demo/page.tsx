import type { Metadata } from 'next';
import { CalendarDays, MessageCircle } from 'lucide-react';
import MarketingContactForm from '../components/MarketingContactForm';
import { CorporatePageHero, CorporatePageLayout } from '../components/CorporatePageLayout';

export const metadata: Metadata = {
  title: 'Book a Demo',
  description: 'Tell us about your business and prepare a demo request for the Riselocal team.',
};

export default function BookDemoPage() {
  return (
    <CorporatePageLayout>
      <CorporatePageHero
        eyebrow="LET'S TALK"
        title="See how Riselocal could fit your business."
        description="Share a little about your business and the workflows you want to explore. Your details will be added to an email draft for you to review."
        image={{
          src: '/images/marketing/platform-illustration.svg',
          alt: 'Illustration of a connected business workspace',
          caption: 'A look at connected business workflows',
        }}
      >
        <a
          className="corp-button corp-button--secondary"
          href="https://wa.me/919505180071?text=Hello%2C%20I%20would%20like%20to%20know%20more%20about%20RiseLocal."
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={17} aria-hidden="true" />
          Contact on WhatsApp
        </a>
      </CorporatePageHero>

      <section className="corp-section">
        <div className="corp-container">
          <div className="corp-form-layout">
            <aside className="corp-card">
              <div className="corp-card__icon">
                <CalendarDays size={22} aria-hidden="true" />
              </div>
              <h2>Request a conversation</h2>
              <p>
                Let us know your industry and what you want to understand. The team can discuss the
                platform, relevant modules and your questions.
              </p>
              <p className="corp-resource-note corp-resource-note--spaced">
                There is no connected demo-request API at this time. The form prepares an email
                draft; sending it is your choice.
              </p>
            </aside>
            <div className="corp-card">
              <MarketingContactForm kind="demo" />
            </div>
          </div>
        </div>
      </section>
    </CorporatePageLayout>
  );
}
