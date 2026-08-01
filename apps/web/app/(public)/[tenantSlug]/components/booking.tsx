'use client';

import { useState } from 'react';
import { inputStyle } from '@/lib/ui-constants';
import { capturePublicCtaLead } from '@/lib/public-lead-capture';

type Props = {
  tenantId?: string;
  tenantSlug?: string;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  locationPlaceholder?: string;
};

export default function Booking({
  tenantId,
  tenantSlug,
  title = 'Book Home Visit',
  subtitle = 'Share your details and preferred time so the team can follow up quickly.',
  submitLabel = 'Confirm Booking',
  locationPlaceholder = 'Location',
}: Readonly<Props>) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateField = (field: 'name' | 'phone' | 'location' | 'date', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValid =
    formData.name.trim().length > 0 &&
    formData.phone.trim().length > 0 &&
    formData.location.trim().length > 0;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await capturePublicCtaLead({
        tenantSlug,
        source: 'Booking',
        actionType: 'booking',
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        bookingDate: formData.date || undefined,
        notes: formData.date ? `Preferred Date: ${formData.date}` : undefined,
        pageUrl: globalThis.location.href,
        buttonId: 'booking-confirm',
      });

      if (!result.success) {
        setError(result.message || 'Booking failed. Please try again.');
        return;
      }

      setFormData({ name: '', phone: '', location: '', date: '' });
      setSuccess('Booking submitted successfully.');
    } catch (err) {
      console.error('Booking submission failed', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 6 }}>{title}</h2>
      <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14 }}>{subtitle}</p>

      <form
        onSubmit={onSubmit}
        style={{
          display: 'grid',
          gap: 10,
        }}
      >
        <input
          aria-label="Your Name"
          placeholder="Your Name"
          value={formData.name}
          onChange={(event) => updateField('name', event.target.value)}
          style={inputStyle}
        />

        <input
          aria-label="Phone Number"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={(event) => updateField('phone', event.target.value)}
          style={inputStyle}
        />

        <input
          aria-label="Location"
          placeholder={locationPlaceholder}
          value={formData.location}
          onChange={(event) => updateField('location', event.target.value)}
          style={inputStyle}
        />

        <input
          aria-label="Preferred Date"
          type="date"
          value={formData.date}
          onChange={(event) => updateField('date', event.target.value)}
          style={inputStyle}
        />

        {error ? (
          <p style={{ margin: 0, color: '#b91c1c', fontSize: 13 }} role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p style={{ margin: 0, color: '#15803d', fontSize: 13 }} role="status">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!isValid || submitting}
          style={{
            padding: 12,
            borderRadius: 10,
            border: 'none',
            background: '#000',
            color: '#fff',
            fontWeight: 600,
            cursor: !isValid || submitting ? 'not-allowed' : 'pointer',
            opacity: !isValid || submitting ? 0.65 : 1,
          }}
        >
          {submitting ? 'Submitting...' : submitLabel}
        </button>
      </form>
    </div>
  );
}
