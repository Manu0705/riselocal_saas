'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star, Check, X } from 'lucide-react';
import MobilePageTitle from '../components/mobile-page-title';
import { api } from '@/lib/api-client';
import { useDashboardData } from '@/context/DashboardDataContext';
import { toast } from 'sonner';

type Review = {
  id: string;
  leadId: string;
  comment: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  rating: number | null;
  status: 'PENDING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';
  createdAt: string;
  lead?: {
    name: string;
  };
};

type ApiListResponse<T> = T[] | { data?: T[] };

type LeadSummary = {
  id: string;
  name: string;
};

export default function ReviewsPage() {
  const { tenant, tenantSlug } = useDashboardData();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = useCallback(async () => {
    const slugOrId = tenantSlug || tenant?.slug || tenant?.id;
    if (!slugOrId) return;

    try {
      setLoading(true);
      const response = (await api.get(`/tenant/${slugOrId}/feedback`)) as ApiListResponse<Review>;
      const data = Array.isArray(response) ? response : response.data || [];

      // Fetch lead names for each review
      const leadsResponse = (await api.get(
        `/tenant/${slugOrId}/leads`,
      )) as ApiListResponse<LeadSummary>;
      const leads = Array.isArray(leadsResponse) ? leadsResponse : leadsResponse.data || [];

      const reviewsWithLeads = data.map((review) => ({
        ...review,
        lead: leads.find((lead) => lead.id === review.leadId),
      }));

      setReviews(reviewsWithLeads);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, tenant?.id, tenant?.slug]);

  useEffect(() => {
    if (tenantSlug || tenant?.id) {
      void fetchReviews();
    }
  }, [fetchReviews, tenantSlug, tenant?.id]);

  async function handleApprove(reviewId: string) {
    try {
      await api.patch(`/feedback/${reviewId}/approve`);
      // Refresh reviews
      void fetchReviews();
      toast.success('Review approved');
    } catch (err) {
      console.error('Error approving review:', err);
      toast.error('Failed to approve review');
    }
  }

  async function handleReject(reviewId: string) {
    try {
      await api.patch(`/feedback/${reviewId}/reject`);
      // Refresh reviews
      void fetchReviews();
      toast.success('Review rejected');
    } catch (err) {
      console.error('Error rejecting review:', err);
      toast.error('Failed to reject review');
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PUBLISHED':
      case 'APPROVED':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'REJECTED':
        return '#ef4444';
      default:
        return 'var(--muted)';
    }
  }

  function getStatusLabel(status: string) {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  if (loading) {
    return (
      <div style={{ padding: 16, paddingBottom: 100 }}>
        <MobilePageTitle title="Reviews" />
        <p style={{ color: 'var(--muted)', marginTop: 20 }}>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <MobilePageTitle title="Reviews" />

      {error && <p style={{ color: '#b91c1c', marginTop: 20 }}>{error}</p>}

      {!error && reviews.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 40,
            padding: 24,
            border: '1px solid var(--card-border)',
            borderRadius: 14,
            background: 'var(--card)',
          }}
        >
          <Star size={48} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            No reviews yet. Mark a lead as &quot;Converted&quot; and send them a review request!
          </p>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: 12,
          marginTop: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}
      >
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              border: '1px solid var(--card-border)',
              borderRadius: 14,
              background: 'var(--card)',
              boxShadow: '0 8px 18px var(--shadow)',
              padding: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {review.lead?.name || 'Unknown Lead'}
                </p>
                {review.rating && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < review.rating! ? '#fbbf24' : 'transparent'}
                        stroke={i < review.rating! ? '#fbbf24' : 'var(--card-border)'}
                      />
                    ))}
                  </div>
                )}
              </div>

              <span
                style={{
                  color: getStatusColor(review.status),
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                {getStatusLabel(review.status)}
              </span>
            </div>

            <p
              style={{
                margin: '8px 0 0',
                color: 'var(--text)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {review.comment}
            </p>

            {review.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => handleApprove(review.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px',
                    border: 'none',
                    borderRadius: 8,
                    background: '#10b981',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Check size={14} />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(review.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px',
                    border: 'none',
                    borderRadius: 8,
                    background: '#ef4444',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                  Reject
                </button>
              </div>
            )}

            <p
              style={{
                margin: '8px 0 0',
                color: 'var(--muted)',
                fontSize: 11,
                textAlign: 'right',
              }}
            >
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
