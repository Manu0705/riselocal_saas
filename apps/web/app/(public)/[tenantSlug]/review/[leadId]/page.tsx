'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { api } from '@/lib/api-client';

type Lead = {
  id: string;
  name: string;
  status?: string;
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;
  const tenantSlug = params.tenantSlug as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const response = (await api.get(`/public/tenant/${tenantSlug}/leads/${leadId}`)) as {
        success?: boolean;
        data?: Lead;
      };

      if (!response?.data) {
        setError('Lead not found');
        return;
      }

      setLead({ ...response.data });
    } catch (err) {
      console.error('Error fetching lead:', err);
      setError('Unable to load review form');
    } finally {
      setLoading(false);
    }
  }, [leadId, tenantSlug]);

  useEffect(() => {
    void fetchLead();
  }, [fetchLead]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!rating) {
      setFormError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setFormError('Please write a comment');
      return;
    }

    if (!lead) return;

    setSubmitting(true);
    try {
      const type = rating >= 4 ? 'POSITIVE' : rating >= 3 ? 'NEUTRAL' : 'NEGATIVE';

      await api.post(`/public/tenant/${tenantSlug}/review`, {
        leadId: lead.id,
        comment: comment.trim(),
        type,
        rating,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting review:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          width: 'min(100%, var(--app-max-width))',
          margin: '0 auto',
          padding: 24,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: 'min(100%, var(--app-max-width))',
          margin: '0 auto',
          padding: 24,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <p style={{ color: '#b91c1c', fontSize: 18, fontWeight: 600 }}>{error}</p>
        <button
          onClick={() => router.push(`/${tenantSlug}`)}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: 8,
            background: '#2563eb',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        style={{
          width: 'min(100%, var(--app-max-width))',
          margin: '0 auto',
          padding: 24,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, textAlign: 'center' }}>
          Thank You for Your Feedback!
        </h2>
        <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: 16, margin: 0 }}>
          Your review helps us improve our service quality.
        </p>
        <button
          onClick={() => router.push(`/${tenantSlug}`)}
          style={{
            marginTop: 12,
            padding: '12px 32px',
            border: 'none',
            borderRadius: 8,
            background: '#2563eb',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to Homepage
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 'min(100%, var(--app-max-width))',
        margin: '0 auto',
        padding: 24,
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          borderRadius: 16,
          padding: 24,
          marginTop: 40,
          boxShadow: '0 8px 24px var(--shadow)',
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          How Was Your Experience?
        </h1>
        <p
          style={{
            color: 'var(--muted)',
            fontSize: 14,
            marginBottom: 28,
            textAlign: 'center',
          }}
        >
          We would love to hear your feedback, {lead?.name}!
        </p>

        <form onSubmit={handleSubmit}>
          {formError ? (
            <div
              style={{
                border: '1px solid #fca5a5',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {formError}
            </div>
          ) : null}

          {/* Star Rating */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 12,
                fontWeight: 600,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              Rate Your Experience
            </label>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 4,
                    transition: 'transform 150ms ease',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.9)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Star
                    size={40}
                    fill={star <= (hoveredRating || rating) ? '#fbbf24' : 'transparent'}
                    stroke={star <= (hoveredRating || rating) ? '#fbbf24' : 'var(--card-border)'}
                    strokeWidth={2}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p
                style={{
                  textAlign: 'center',
                  marginTop: 12,
                  fontSize: 14,
                  color: 'var(--muted)',
                }}
              >
                {rating === 5
                  ? 'Excellent!'
                  : rating === 4
                    ? 'Great!'
                    : rating === 3
                      ? 'Good'
                      : rating === 2
                        ? 'Fair'
                        : 'Needs Improvement'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Tell us more (required)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with us..."
              rows={5}
              required
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid var(--card-border)',
                borderRadius: 8,
                fontSize: 14,
                background: 'var(--background)',
                color: 'var(--text)',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !rating || !comment.trim()}
            style={{
              width: '100%',
              padding: 14,
              border: 'none',
              borderRadius: 8,
              background: !rating || !comment.trim() ? 'var(--muted)' : '#2563eb',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: !rating || !comment.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
