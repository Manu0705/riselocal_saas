import type { Metadata } from 'next';
import { CorporatePageHero, CorporatePageLayout } from '../components/CorporatePageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy policy framework for Riselocal, with details requiring confirmation clearly identified.',
};

export default function PrivacyPolicyPage() {
  return (
    <CorporatePageLayout>
      <CorporatePageHero
        eyebrow="PRIVACY"
        title="Privacy Policy"
        description="Draft framework — the business and data-handling details below must be confirmed before this page is treated as a final policy."
      />

      <section className="corp-section">
        <div className="corp-container">
          <div className="corp-legal-content">
            <p className="corp-resource-note">
              Confirmation required: the legal entity operating Riselocal, effective date, privacy
              contact, applicable jurisdictions, service data practices, retention periods,
              subprocessors, security controls and applicable individual rights.
            </p>

            <section>
              <h2>Who operates the service</h2>
              <p>
                The legal name and contact address of the organisation responsible for Riselocal
                must be supplied and confirmed here. Do not rely on this draft to identify a data
                controller or service operator.
              </p>
            </section>

            <section>
              <h2>Information this policy should cover</h2>
              <p>
                Before publication, document the categories of information collected through the
                website and services, how each category is obtained, and the purposes and lawful
                basis, where applicable, for its use.
              </p>
            </section>

            <section>
              <h2>Website request forms</h2>
              <p>
                The demo and contact forms on this site prepare an email draft in the visitor’s
                email application. They do not submit form details to a Riselocal server. If a
                visitor chooses to send the draft, the email is handled by the visitor’s email
                provider and the recipient’s mail service.
              </p>
            </section>

            <section>
              <h2>Use, sharing and retention</h2>
              <p>
                The service’s actual uses of information, disclosures to service providers or other
                parties, retention periods, and deletion practices require confirmation and must be
                described accurately before publication.
              </p>
            </section>

            <section>
              <h2>Security, rights and contact</h2>
              <p>
                Add verified information about safeguards, any applicable privacy rights and how to
                exercise them, complaint or appeal routes, and a monitored privacy contact. No
                compliance certification or specific legal obligation is asserted by this draft.
              </p>
            </section>

            <section>
              <h2>Changes to this policy</h2>
              <p>
                Confirm how policy changes will be communicated and add an effective date and change
                history when an approved policy is published.
              </p>
            </section>
          </div>
        </div>
      </section>
    </CorporatePageLayout>
  );
}
