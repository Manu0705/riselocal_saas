
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api-client';

type Payment = {
  id: string;
  studentId?: string;
  amount?: number | string;
  currency?: string;
  method?: string;
  upiVpa?: string | null;
  status?: string;
  createdAt?: string | null;
  initiatedAt?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  utr?: string | null;
  transactionReferenceId?: string | null;
  proofUrl?: string | null;
  rejectedReason?: string | null;
  student?: {
    id?: string;
    name?: string;
    admissionNumber?: string;
  } | null;
  receipt?: {
    id?: string;
    receiptNumber?: string;
    amount?: number | string;
    issuedAt?: string | null;
  } | null;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

function unwrapPayment(value: unknown): Payment | null {
  let current: unknown = value;

  // Support both a direct response and nested { success, data } wrappers.
  for (let i = 0; i < 3; i += 1) {
    if (!current || typeof current !== 'object') {
      return null;
    }

    const record = current as Record<string, unknown>;

    if (typeof record.id === 'string') {
      return current as Payment;
    }

    if ('data' in record) {
      current = record.data;
      continue;
    }

    if ('payment' in record) {
      current = record.payment;
      continue;
    }

    return null;
  }

  if (
    current &&
    typeof current === 'object' &&
    typeof (current as Record<string, unknown>).id === 'string'
  ) {
    return current as Payment;
  }

  return null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatAmount(value?: number | string): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusClasses(status?: string): string {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'VERIFIED':
      return 'bg-green-100 text-green-800';
    case 'SUBMITTED':
    case 'VERIFYING':
      return 'bg-blue-100 text-blue-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'INITIATED':
    case 'PENDING':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function Detail({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value?: string | null;
  breakAll?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`mt-1 text-sm font-medium text-gray-900 ${
          breakAll ? 'break-all' : 'break-words'
        }`}
      >
        {value || '—'}
      </p>
    </div>
  );
}

export default function PaymentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = String(params?.id ?? '');

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadPayment = useCallback(
    async (showRefresh = false) => {
      if (!paymentId) {
        setError('Payment ID is missing.');
        setLoading(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const response = await api.get<ApiEnvelope<Payment> | Payment>(
          `/hostel/payments/${encodeURIComponent(paymentId)}`,
        );

        const loadedPayment = unwrapPayment(response);

        if (!loadedPayment) {
          throw new Error(
            'The payment details response was empty or invalid.',
          );
        }

        setPayment(loadedPayment);
      } catch (err) {
        console.error('Failed to load payment details:', err);

        setError(
          getErrorMessage(err, 'Unable to load payment details.'),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [paymentId],
  );

  useEffect(() => {
    void loadPayment();

  }, [loadPayment]);

  const handleVerify = async () => {
    if (!payment || actionLoading) return;

    const confirmed = window.confirm(
      `Verify the payment of ${formatAmount(payment.amount)}? ` +
        'Confirm only after checking the actual transaction.',
    );

    if (!confirmed) return;

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      await api.post(
        `/hostel/payments/${encodeURIComponent(payment.id)}/verify`,
        {
          idempotencyKey: crypto.randomUUID(),
        },
      );

      setActionSuccess('Payment verified successfully.');
      await loadPayment(true);
    } catch (err) {
      console.error('Failed to verify payment:', err);

      setActionError(
        getErrorMessage(
          err,
          'Unable to verify the payment. Please try again.',
        ),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!payment || actionLoading) return;

    const reason = window.prompt(
      'Enter the reason for rejecting this payment:',
    );

    if (!reason?.trim()) return;

    const confirmed = window.confirm(
      'Are you sure you want to reject this payment?',
    );

    if (!confirmed) return;

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      await api.post(
        `/hostel/payments/${encodeURIComponent(payment.id)}/reject`,
        {
          reason: reason.trim(),
          idempotencyKey: crypto.randomUUID(),
        },
      );

      setActionSuccess('Payment rejected successfully.');
      await loadPayment(true);
    } catch (err) {
      console.error('Failed to reject payment:', err);

      setActionError(
        getErrorMessage(
          err,
          'Unable to reject the payment. Please try again.',
        ),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const canReviewPayment =
    payment?.status === 'SUBMITTED' ||
    payment?.status === 'VERIFYING';

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <RefreshCw className="animate-spin" size={18} />
          Loading payment details...
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <Link
          href="/dashboard/hostel/payments"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </Link>

        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div className="flex-1">{error}</div>
        </div>

        <button
          type="button"
          onClick={() => void loadPayment()}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <RefreshCw size={15} />
          Retry
        </button>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <Link
          href="/dashboard/hostel/payments"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </Link>

        <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
          Payment not found.
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <header>
        <Link
          href="/dashboard/hostel/payments"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Hostel Finance
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Payment Details
            </h1>

            <p className="mt-2 break-all text-sm text-gray-500">
              Payment ID: {payment.id}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses(
                payment.status,
              )}`}
            >
              {payment.status || 'UNKNOWN'}
            </span>

            <button
              type="button"
              onClick={() => void loadPayment(true)}
              disabled={refreshing || actionLoading}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          {error}
        </div>
      )}

      {actionSuccess && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          <p>{actionSuccess}</p>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <p>{actionError}</p>
        </div>
      )}

      {canReviewPayment && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-blue-700"
              size={22}
            />

            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">
                Payment requires review
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                Check the UTR or transaction reference and verify the
                actual payment before approving it. Verification is a
                manual action; this page does not confirm bank transfers
                automatically.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleVerify()}
                  disabled={actionLoading || payment.status === 'PAID'}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  {actionLoading
                    ? 'Processing...'
                    : payment.status === 'PAID'
                      ? 'Payment Verified'
                      : 'Verify Payment'}
                </button>

                <button
                  type="button"
                  onClick={() => void handleReject()}
                  disabled={actionLoading}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reject Payment
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {payment.status === 'INITIATED' && (
        <section className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Clock className="mt-0.5 shrink-0 text-amber-700" size={19} />
          <div>
            <h2 className="text-sm font-semibold text-amber-900">
              Awaiting student submission
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              The payment has been initiated, but transaction details
              have not been submitted yet. Verification and rejection
              actions are available after the student submits the payment
              details.
            </p>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900">
            Payment Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatAmount(payment.amount)}
              </p>
            </div>

            <Detail label="Currency" value={payment.currency || 'INR'} />
            <Detail label="Payment Method" value={payment.method} />
            <Detail label="UPI ID" value={payment.upiVpa} />
            <Detail
              label="Initiated"
              value={formatDate(payment.initiatedAt || payment.createdAt)}
            />
            <Detail
              label="Last Updated"
              value={formatDate(payment.verifiedAt)}
            />
            <Detail
              label="Submitted At"
              value={formatDate(payment.submittedAt)}
            />
            <Detail
              label="Verified At"
              value={formatDate(payment.verifiedAt)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900">
            Student Information
          </h2>

          <div className="mt-5 grid gap-5">
            <Detail
              label="Student Name"
              value={payment.student?.name}
            />
            <Detail
              label="Admission Number"
              value={payment.student?.admissionNumber}
            />
            <Detail
              label="Student ID"
              value={payment.studentId || payment.student?.id}
              breakAll
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <FileText size={19} className="text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Transaction Information
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Detail label="UTR" value={payment.utr} breakAll />
          <Detail
            label="Transaction Reference"
            value={payment.transactionReferenceId}
            breakAll
          />
          <Detail
            label="Payment Proof URL"
            value={payment.proofUrl}
            breakAll
          />
        </div>

        {payment.proofUrl && (
          <a
            href={payment.proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-gray-50"
          >
            View Payment Proof
            <ExternalLink size={15} />
          </a>
        )}

        {payment.rejectedReason && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">
              Rejection Reason
            </p>
            <p className="mt-1 text-sm text-red-700">
              {payment.rejectedReason}
            </p>
          </div>
        )}
      </section>

      {payment.receipt && (
        <section className="rounded-xl border border-green-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={19} className="text-green-700" />
            <h2 className="text-base font-semibold text-gray-900">
              Receipt
            </h2>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <Detail
              label="Receipt Number"
              value={payment.receipt.receiptNumber}
            />
            <Detail
              label="Receipt Amount"
              value={formatAmount(payment.receipt.amount)}
            />
            <Detail
              label="Issued At"
              value={formatDate(payment.receipt.issuedAt)}
            />
          </div>

          {payment.receipt.id && (
            <Link
              href="/dashboard/hostel/receipts"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
            >
              View Receipts
              <ArrowLeft className="rotate-180" size={15} />
            </Link>
          )}
        </section>
      )}

      <footer className="pb-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/hostel/payments')}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </button>
      </footer>
    </main>
  );
}
