
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { AlertCircle, RefreshCw } from 'lucide-react';

type HostelPayment = {
  id: string;
  amount: string | number;
  status: string;
  currency?: string;
  method?: string;
  createdAt?: string | null;
  initiatedAt?: string | null;
  student?: {
    id: string;
    name: string;
    admissionNumber?: string | null;
  } | null;
  receipt?: {
    id: string;
  } | null;
};

type PaymentPage = {
  items: HostelPayment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

const STATUS_OPTIONS = [
  'ALL',
  'INITIATED',
  'PENDING',
  'SUBMITTED',
  'VERIFYING',
  'VERIFIED',
  'PAID',
  'FAILED',
  'REJECTED',
  'REFUNDED',
];

function extractPaymentPage(value: unknown): PaymentPage {
  let current = value;

  // Handle { success, data: { items, pagination } } and direct payloads.
  for (let i = 0; i < 3; i += 1) {
    if (!current || typeof current !== 'object') break;

    const record = current as Record<string, unknown>;

    if (Array.isArray(record.items)) {
      const pagination = record.pagination;

      return {
        items: record.items as HostelPayment[],
        pagination:
          pagination && typeof pagination === 'object'
            ? (pagination as PaymentPage['pagination'])
            : undefined,
      };
    }

    if ('data' in record) {
      current = record.data;
      continue;
    }

    if ('payments' in record) {
      current = record.payments;
      continue;
    }

    break;
  }

  if (Array.isArray(current)) {
    return { items: current as HostelPayment[] };
  }

  return { items: [] };
}

function formatAmount(value: number | string, currency = 'INR') {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return '—';

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '5px 9px',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };

  switch (status.toUpperCase()) {
    case 'VERIFIED':
    case 'PAID':
      return { ...base, background: '#dcfce7', color: '#166534' };

    case 'SUBMITTED':
    case 'VERIFYING':
      return { ...base, background: '#dbeafe', color: '#1d4ed8' };

    case 'REJECTED':
    case 'FAILED':
      return { ...base, background: '#fee2e2', color: '#991b1b' };

    case 'INITIATED':
    case 'PENDING':
      return { ...base, background: '#fef3c7', color: '#92400e' };

    case 'REFUNDED':
      return { ...base, background: '#f3e8ff', color: '#6b21a8' };

    default:
      return { ...base, background: '#f3f4f6', color: '#374151' };
  }
}

export default function HostelPaymentsPage() {
  const [payments, setPayments] = useState<HostelPayment[]>([]);
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '25',
      });

      if (status !== 'ALL') {
        query.set('status', status);
      }

      const response = await api.get<
        ApiResponse<PaymentPage> | PaymentPage
      >(`/hostel/payments?${query.toString()}`);

      const result = extractPaymentPage(response);
      const pagination = result.pagination;

      setPayments(result.items);
      setTotalPages(
        Math.max(1, Number(pagination?.totalPages) || 1),
      );
      setTotalPayments(
        Math.max(0, Number(pagination?.total) || result.items.length),
      );
    } catch (err) {
      console.error('Failed to load hostel payments:', err);

      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to load payments. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  function handleStatusChange(value: string) {
    setStatus(value);
    setPage(1);
  }

  return (
    <main style={{ width: '100%', minWidth: 0 }}>
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--foreground, #111827)',
          }}
        >
          Payments
        </h1>

        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            color: 'var(--muted, #6b7280)',
          }}
        >
          View and manage hostel payments, transaction submissions, and
          verification status.
        </p>
      </header>

      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--foreground, #111827)',
          }}
        >
          Status
          <select
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              maxWidth: 220,
              minWidth: 150,
              height: 40,
              padding: '0 12px',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 8,
              background: 'var(--bg, #ffffff)',
              color: 'var(--foreground, #111827)',
              fontSize: 13,
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'ALL' ? 'All Statuses' : option}
              </option>
            ))}
          </select>
        </label>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: 13,
            color: 'var(--muted, #6b7280)',
          }}
        >
          <span>{totalPayments} payments</span>

          <button
            type="button"
            onClick={() => void loadPayments()}
            disabled={loading}
            style={buttonStyle(loading)}
          >
            <RefreshCw
              size={14}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>
      </section>

      <section
        style={{
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 24,
              color: 'var(--muted, #6b7280)',
              fontSize: 14,
            }}
          >
            <RefreshCw size={17} className="animate-spin" />
            Loading payments...
          </div>
        ) : error ? (
          <div style={{ padding: 24 }}>
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                color: '#b91c1c',
                fontSize: 14,
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => void loadPayments()}
              style={{ ...buttonStyle(false), marginTop: 16 }}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--muted, #6b7280)',
            }}
          >
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              No payments found
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>
              Try another status filter or check again after a payment is
              initiated.
            </p>
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: 720,
              }}
            >
              <thead>
                <tr>
                  <th style={headerStyle}>Student</th>
                  <th style={headerStyle}>Admission No.</th>
                  <th style={headerStyle}>Amount</th>
                  <th style={headerStyle}>Method</th>
                  <th style={headerStyle}>Status</th>
                  <th style={headerStyle}>Date</th>
                  <th style={headerStyle}>Action</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={cellStyle}>
                      {payment.student ? (
                        <Link
                          href={`/dashboard/hostel/students/${payment.student.id}`}
                          style={{
                            fontWeight: 600,
                            textDecoration: 'none',
                            color: 'var(--foreground, #111827)',
                          }}
                        >
                          {payment.student.name || 'Unnamed student'}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td style={cellStyle}>
                      {payment.student?.admissionNumber || '—'}
                    </td>

                    <td style={{ ...cellStyle, fontWeight: 600 }}>
                      {formatAmount(payment.amount, payment.currency)}
                    </td>

                    <td style={cellStyle}>{payment.method || '—'}</td>

                    <td style={cellStyle}>
                      <span style={statusStyle(payment.status)}>
                        {payment.status || 'UNKNOWN'}
                      </span>
                    </td>

                    <td style={cellStyle}>
                      {formatDate(payment.initiatedAt || payment.createdAt)}
                    </td>

                    <td style={cellStyle}>
                      <Link
                        href={`/dashboard/hostel/payments/${payment.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 32,
                          padding: '0 11px',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: 7,
                          fontWeight: 600,
                          textDecoration: 'none',
                          color: 'var(--foreground, #111827)',
                        }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: 'var(--muted, #6b7280)',
          }}
        >
          Page {page} of {totalPages}
        </span>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            disabled={page === 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            style={buttonStyle(page === 1 || loading)}
          >
            Previous
          </button>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            style={buttonStyle(page >= totalPages || loading)}
          >
            Next
          </button>
        </div>
      </footer>
    </main>
  );
}

const headerStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--muted, #6b7280)',
  background: 'var(--bg, #ffffff)',
  borderBottom: '1px solid var(--border, #e5e7eb)',
  whiteSpace: 'nowrap',
};

const cellStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: 13,
  color: 'var(--foreground, #111827)',
  borderBottom: '1px solid var(--border, #e5e7eb)',
  whiteSpace: 'nowrap',
};

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 36,
    padding: '0 12px',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: 8,
    background: 'var(--bg, #ffffff)',
    color: 'var(--foreground, #111827)',
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
