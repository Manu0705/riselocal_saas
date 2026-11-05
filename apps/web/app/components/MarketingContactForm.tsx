'use client';

import { useState, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';

const CONTACT_EMAIL = 'saptagiri.p@outlook.com';

const industries = ['Hostels & PGs', 'Dining', 'Professionals', 'Agencies', 'Other'];

interface MarketingContactFormProps {
  kind: 'demo' | 'contact';
}

export default function MarketingContactForm({ kind }: MarketingContactFormProps) {
  const [emailDraft, setEmailDraft] = useState('');
  const subject = kind === 'demo' ? 'Riselocal demo request' : 'Riselocal contact request';

  function prepareEmailDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const fields = [
      ['Name', formData.get('name')],
      ['Business name', formData.get('businessName')],
      ['Email', formData.get('email')],
      ['Phone', formData.get('phone')],
      ['Industry', formData.get('industry')],
      ['Message', formData.get('message')],
    ];
    const body = fields
      .map(([label, value]) => `${label}: ${String(value ?? '').trim()}`)
      .join('\n');
    const query = new URLSearchParams({ subject, body });

    setEmailDraft(`mailto:${CONTACT_EMAIL}?${query.toString()}`);
  }

  return (
    <form className="corp-form" onSubmit={prepareEmailDraft}>
      <div className="corp-form__grid">
        <div className="corp-field">
          <label htmlFor={`${kind}-name`}>Name</label>
          <input id={`${kind}-name`} name="name" autoComplete="name" required />
        </div>

        <div className="corp-field">
          <label htmlFor={`${kind}-business`}>Business name</label>
          <input id={`${kind}-business`} name="businessName" autoComplete="organization" required />
        </div>

        <div className="corp-field">
          <label htmlFor={`${kind}-email`}>Email</label>
          <input id={`${kind}-email`} name="email" type="email" autoComplete="email" required />
        </div>

        <div className="corp-field">
          <label htmlFor={`${kind}-phone`}>Phone</label>
          <input id={`${kind}-phone`} name="phone" type="tel" autoComplete="tel" required />
        </div>

        <div className="corp-field corp-field--full">
          <label htmlFor={`${kind}-industry`}>Industry</label>
          <select id={`${kind}-industry`} name="industry" defaultValue="" required>
            <option value="" disabled>
              Select an industry
            </option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        <div className="corp-field corp-field--full">
          <label htmlFor={`${kind}-message`}>How can we help?</label>
          <textarea id={`${kind}-message`} name="message" rows={5} required />
        </div>
      </div>

      <p className="corp-form__note">
        This form does not submit data to a Riselocal server. It prepares an email draft addressed
        to the currently listed contact email; review and send it in your email app.
      </p>

      {emailDraft ? (
        <p className="corp-form__status" role="status">
          Your message is ready.{' '}
          <a href={emailDraft}>
            Open the email draft <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </p>
      ) : null}

      <button className="corp-button" type="submit">
        {kind === 'demo' ? 'Prepare demo request' : 'Prepare email'}
        <ArrowUpRight size={17} aria-hidden="true" />
      </button>
    </form>
  );
}
