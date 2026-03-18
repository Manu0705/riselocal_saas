'use client';

import { useEffect, useMemo, useState } from 'react';

type LeadCaptureModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  defaultName?: string;
  defaultPhone?: string;
  defaultLocation?: string;
  onClose: () => void;
  onSubmit: (payload: { name: string; phone: string; location?: string }) => Promise<void>;
};

function normalizePhoneInput(input: string): string {
  return input.replace(/[^\d+]/g, '');
}

export default function LeadCaptureModal({
  open,
  title,
  submitLabel,
  defaultName,
  defaultPhone,
  defaultLocation,
  onClose,
  onSubmit,
}: Readonly<LeadCaptureModalProps>) {
  const [name, setName] = useState(defaultName ?? '');
  const [phone, setPhone] = useState(defaultPhone ?? '');
  const [location, setLocation] = useState(defaultLocation ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(defaultName ?? '');
    setPhone(defaultPhone ?? '');
    setLocation(defaultLocation ?? '');
    setError('');
  }, [open, defaultName, defaultPhone, defaultLocation]);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && phone.trim().length > 0 && !submitting;
  }, [name, phone, submitting]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 60,
        padding: 16,
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 14,
          border: '1px solid #d1d5db',
          background: '#ffffff',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
          padding: 16,
          display: 'grid',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 20,
              lineHeight: 1,
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            x
          </button>
        </div>

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          aria-label="Name"
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 14,
          }}
        />

        <input
          value={phone}
          onChange={(event) => setPhone(normalizePhoneInput(event.target.value))}
          placeholder="Phone"
          aria-label="Phone"
          inputMode="tel"
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 14,
          }}
        />

        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Location (optional)"
          aria-label="Location"
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 14,
          }}
        />

        {error ? (
          <p style={{ margin: 0, color: '#b91c1c', fontSize: 13 }}>{error}</p>
        ) : null}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={async () => {
            if (!canSubmit) return;

            setSubmitting(true);
            setError('');
            try {
              await onSubmit({
                name: name.trim(),
                phone: phone.trim(),
                location: location.trim() || undefined,
              });
            } catch (submitError: any) {
              setError(submitError?.message || 'Failed to submit. Please retry.');
            } finally {
              setSubmitting(false);
            }
          }}
          style={{
            border: 'none',
            borderRadius: 8,
            padding: '11px 12px',
            background: '#111827',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.55,
          }}
        >
          {submitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </div>
  );
}
