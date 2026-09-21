'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type HostelPayment = {
  id: string;
  amount: string | number;
  status: string;
  createdAt: string;
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const STATUS_OPTIONS = [
  'ALL',
  'INITIATED',
  'PENDING',
  'SUBMITTED',
  'VERIFYING',
  'PAID',
  'FAILED',
  'REJECTED',
  'REFUNDED',
];

export default function HostelPaymentsPage() {
  const [payments, setPayments] = useState<HostelPayment[]>([]);
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        setError(null);

        const query = new URLSearchParams({
          page: String(page),
          limit: '25',
        });

        if (status !== 'ALL') {
          query.set('status', status);
        }

        const response = await api.get<ApiResponse<PaymentPage>>(
          `/hostel/payments?${query.toString()}`,
        );

        setPayments(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
        setTotalPayments(response.data.pagination.total);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load payments',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPayments();
  }, [page, status]);

  function handleStatusChange(value: string) {
    setStatus(value);
    setPage(1);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
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
          View and manage hostel payments.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <select
          value={status}
          onChange={(event) => handleStatusChange(event.target.value)}
          style={{
            width: '100%',
            maxWidth: 220,
            minWidth: 0,
            height: 40,
            padding: '0 12px',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 8,
            background: 'var(--bg, #ffffff)',
            color: 'var(--foreground, #111827)',
            fontSize: 13,
            outline: 'none',
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All Statuses' : option}
            </option>
          ))}
        </select>

        <div
          style={{
            fontSize: 13,
            color: 'var(--muted, #6b7280)',
          }}
        >
          {totalPayments} payments
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 24 }}>Loading payments...</div>
        ) : error ? (
          <div style={{ padding: 24, color: '#b91c1c' }}>
            {error}
          </div>
        ) : payments.length === 0 ? (
          <div
            style={{
              padding: 24,
              color: 'var(--muted, #6b7280)',
            }}
          >
            No payments found.
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
                minWidth: 620,
              }}
            >
              <thead>
                <tr>
                  <th style={headerStyle}>Student</th>
                  <th style={headerStyle}>Admission No.</th>
                  <th style={headerStyle}>Amount</th>
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
                          }}
                        >
                          {payment.student.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td style={cellStyle}>
                      {payment.student?.admissionNumber ?? '—'}
                    </td>

                    <td style={cellStyle}>
                      ₹{Number(payment.amount).toLocaleString('en-IN')}
                    </td>

                    <td style={cellStyle}>{payment.status}</td>

                    <td style={cellStyle}>
                      {new Date(payment.createdAt).toLocaleDateString(
                        'en-IN',
                      )}
                    </td>

                    <td style={cellStyle}>
                      <Link
                        href={`/dashboard/hostel/payments/${payment.id}`}
                        style={{
                          fontWeight: 600,
                          textDecoration: 'none',
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
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: 'var(--muted, #6b7280)',
          }}
        >
          Page {page} of {totalPages}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            disabled={page === 1 || loading}
            onClick={() => setPage((current) => current - 1)}
            style={buttonStyle(page === 1 || loading)}
          >
            Previous
          </button>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            style={buttonStyle(page >= totalPages || loading)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: '12px 12px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--muted, #6b7280)',
  borderBottom: '1px solid var(--border, #e5e7eb)',
  whiteSpace: 'nowrap',
};

const cellStyle: React.CSSProperties = {
  padding: '12px 12px',
  fontSize: 13,
  color: 'var(--foreground, #111827)',
  borderBottom: '1px solid var(--border, #e5e7eb)',
  whiteSpace: 'nowrap',
};

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    height: 36,
    padding: '0 12px',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: 8,
    background: 'var(--bg, #ffffff)',
    color: 'var(--foreground, #111827)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}