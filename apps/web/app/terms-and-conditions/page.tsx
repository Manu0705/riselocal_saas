import type { Metadata } from 'next';
import { CorporatePageHero, CorporatePageLayout } from '../components/CorporatePageLayout';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description:
    'Terms and conditions framework for Riselocal, with business and service terms requiring confirmation.',
};

export default function TermsAndConditionsPage() {
  return (
    <CorporatePageLayout>
      <CorporatePageHero
        eyebrow="SERVICE TERMS"
        title="Terms and Conditions"
        description="Draft framework — these sections are not complete terms of service and require review and approval before use."
      />

      <section className="corp-section">
        <div className="corp-container">
          <div className="corp-legal-content">
            <p className="corp-resource-note">
              Confirmation required: the operating legal entity and address, effective date, service
              scope, account eligibility, subscription and module terms, payment and cancellation
              rules, customer responsibilities, support commitments, intellectual-property terms,
              liability provisions, dispute process and governing law.
            </p>

            <section>
              <h2>Service provider and agreement</h2>
              <p>
                Identify the organisation providing Riselocal and explain when and how an agreement
                is formed, including any order form or service-specific terms that apply.
              </p>
            </section>

            <section>
              <h2>Accounts and permitted use</h2>
              <p>
                Define who may create and use an account, account-holder responsibilities,
                acceptable use, and any restrictions relevant to the service.
              </p>
            </section>

            <section>
              <h2>Subscriptions, modules and payment</h2>
              <p>
                State the applicable subscription model, fees, taxes, payment timing, renewal,
                changes, cancellation and any refund conditions. No prices or payment commitments
                are specified by this draft.
              </p>
            </section>

            <section>
              <h2>Customer content and service availability</h2>
              <p>
                Confirm rights and responsibilities concerning customer content, data handling,
                availability, maintenance, support and any service-level commitments before
                describing them here.
              </p>
            </section>

            <section>
              <h2>Suspension, termination and liability</h2>
              <p>
                Define the applicable suspension and termination conditions, consequences,
                warranties, liability limitations and any exceptions with qualified legal review.
              </p>
            </section>

            <section>
              <h2>Governing terms and contact</h2>
              <p>
                Add verified governing-law, venue, dispute-resolution, amendments and notice
                provisions, along with a monitored business contact, only after confirmation and
                review.
              </p>
            </section>
          </div>
        </div>
      </section>
    </CorporatePageLayout>
  );
}
