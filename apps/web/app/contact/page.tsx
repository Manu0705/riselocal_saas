import type { Metadata } from 'next';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import MarketingContactForm from '../components/MarketingContactForm';
import { CorporatePageHero, CorporatePageLayout } from '../components/CorporatePageLayout';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact the Riselocal team by email, phone or WhatsApp, or prepare a message.',
};

export default function ContactPage() {
  return (
    <CorporatePageLayout>
      <CorporatePageHero
        eyebrow="CONTACT"
        title="Talk to the Riselocal team."
        description="Have a question about the platform or want to discuss your business needs? Choose a contact option or prepare a message below."
        image={{
          src: '/images/marketing/platform-illustration.svg',
          alt: 'Illustration of a connected Riselocal business workspace',
          caption: 'One place to explore your business needs',
        }}
      />

      <section className="corp-section">
        <div className="corp-container">
          <div className="corp-form-layout">
            <div>
              <div className="corp-section-heading">
                <p className="corp-eyebrow">GET IN TOUCH</p>
                <h2>Choose how you would like to reach us.</h2>
              </div>
              <div className="corp-contact-methods">
                <a className="corp-contact-method" href="mailto:saptagiri.p@outlook.com">
                  <span className="corp-contact-method__icon">
                    <Mail size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>Email</strong>
                    <span>saptagiri.p@outlook.com</span>
                  </span>
                </a>
                <a className="corp-contact-method" href="tel:+919505180071">
                  <span className="corp-contact-method__icon">
                    <Phone size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>Phone</strong>
                    <span>+91 95051 80071</span>
                  </span>
                </a>
                <a
                  className="corp-contact-method"
                  href="https://wa.me/919505180071"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="corp-contact-method__icon">
                    <MessageCircle size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>WhatsApp</strong>
                    <span>Message the Riselocal team</span>
                  </span>
                </a>
                <div className="corp-contact-method">
                  <span className="corp-contact-method__icon">
                    <MapPin size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>Location</strong>
                    <span>India</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="corp-card">
              <div className="corp-section-heading">
                <p className="corp-eyebrow">SEND A MESSAGE</p>
                <h2>Tell us what you need.</h2>
              </div>
              <MarketingContactForm kind="contact" />
            </div>
          </div>
        </div>
      </section>
    </CorporatePageLayout>
  );
}
