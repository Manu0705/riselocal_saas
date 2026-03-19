'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function FeedbackPage() {
  const params = useParams();
  const tenantSlug = String(params.tenantSlug ?? '');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit() {
    if (!tenantSlug) {
      setError('Tenant not found');
      return;
    }

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError('Name, phone and feedback message are required');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post(`/public/tenant/${tenantSlug}/feedback`, {
        name: name.trim(),
        phone: phone.trim(),
        comment: message.trim(),
        rating,
      });

      setSuccess('Feedback submitted successfully. Thank you!');
      setMessage('');
      setPhone('');
      setName('');
      setRating(5);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 560, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 10px' }}>Feedback</h2>
      <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: 14 }}>
        Share your experience so this business can improve.
      </p>

      {error ? (
        <div
          style={{
            border: '1px solid #fca5a5',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: 10,
            padding: 10,
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          style={{
            border: '1px solid #86efac',
            background: '#f0fdf4',
            color: '#16a34a',
            borderRadius: 10,
            padding: 10,
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          {success}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 10 }}>
        <input
          value={name}
          placeholder="Your name"
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: '1px solid var(--card-border)',
            background: 'var(--card)',
            color: 'var(--text)',
          }}
        />
        <input
          value={phone}
          placeholder="Phone number"
          onChange={(e) => setPhone(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: '1px solid var(--card-border)',
            background: 'var(--card)',
            color: 'var(--text)',
          }}
        />
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: '1px solid var(--card-border)',
            background: 'var(--card)',
            color: 'var(--text)',
          }}
        >
          <option value={5}>5 - Excellent</option>
          <option value={4}>4 - Great</option>
          <option value={3}>3 - Good</option>
          <option value={2}>2 - Fair</option>
          <option value={1}>1 - Needs Improvement</option>
        </select>
        <textarea
          value={message}
          rows={4}
          placeholder="Write your feedback"
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: '1px solid var(--card-border)',
            background: 'var(--card)',
            color: 'var(--text)',
            resize: 'vertical',
          }}
        />
        <button
          onClick={submit}
          disabled={submitting}
          style={{
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 8,
            padding: '12px 14px',
            fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.75 : 1,
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
}
