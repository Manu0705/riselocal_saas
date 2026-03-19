'use client';

import { useState } from 'react';
import { inputStyle } from '@/lib/ui-constants';
import { capturePublicCtaLead } from '@/lib/public-lead-capture';

type Props = {
  tenantId?: string;
  tenantSlug?: string;
};

export default function Booking({ tenantId, tenantSlug }: Readonly<Props>) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    date: '',
  });
  const [submitting, setSubmitting] = useState(false);

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

    try {
      await capturePublicCtaLead({
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

      setFormData({ name: '', phone: '', location: '', date: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Book Home Visit</h2>

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
          placeholder="Location"
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
          {submitting ? 'Submitting...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}
