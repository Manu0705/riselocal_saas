'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';

type Payment = {
  id: string;
  studentId?: string;
  amount?: number | string;
  status?: string;
  createdAt?: string;
  submittedAt?: string | null;
  utr?: string | null;
  transactionReferenceId?: string | null;
  proofUrl?: string | null;
  student?: {
    id?: string;
    name?: string;
    admissionNumber?: string;
  } | null;
  receipt?: {
    id?: string;
    receiptNumber?: string;
    amount?: number | string;
    issuedAt?: string;
  } | null;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
};

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatAmount(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PaymentDetailsPage() {
  const params = useParams();
  const paymentId = params?.id as string;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    if (!paymentId) return;

    const loadPayment = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get<ApiResponse<Payment>>(
          `/hostel/payments/${paymentId}`,
        );

        setPayment(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [paymentId]);

  const handleVerify = async () => {
    if (!payment) return;

    const confirmed = window.confirm(
      'Are you sure you want to verify this payment?',
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setActionError('');
      setActionSuccess('');

      await api.post(`/payments/${payment.id}/verify`, {
        idempotencyKey: crypto.randomUUID(),
      });

      setActionSuccess('Payment verified successfully.');

      const response = await api.get<ApiResponse<Payment>>(
        `/hostel/payments/${paymentId}`,
      );

      setPayment(response.data);
    } catch (err) {
      console.error(err);
      setActionError('Failed to verify payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!payment) return;

    const reason = window.prompt('Enter the rejection reason:');

    if (!reason?.trim()) return;

    try {
      setActionLoading(true);
      setActionError('');
      setActionSuccess('');

      await api.post(`/payments/${payment.id}/reject`, {
        reason: reason.trim(),
        idempotencyKey: crypto.randomUUID(),
      });

      setActionSuccess('Payment rejected successfully.');

      const response = await api.get<ApiResponse<Payment>>(
        `/hostel/payments/${paymentId}`,
      );

      setPayment(response.data);
    } catch (err) {
      console.error(err);
      setActionError('Failed to reject payment.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          Loading payment details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Link
          href="/dashboard/hostel/payments"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Payments
        </Link>

        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-6">
        <Link
          href="/dashboard/hostel/payments"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Payments
        </Link>

        <p className="mt-6 text-sm text-gray-500">
          Payment not found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/hostel/payments"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Payments
        </Link>

        <div className="mt-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            Payment Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Payment ID: {payment.id}
          </p>
        </div>
      </div>

      {/* Payment Actions */}
      {(payment.status === 'SUBMITTED' ||
        payment.status === 'VERIFYING') && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Payment Actions
          </h2>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={actionLoading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Verify Payment'}
            </button>

            <button
              type="button"
              onClick={handleReject}
              disabled={actionLoading}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject Payment
            </button>
          </div>
        </div>
      )}

      {/* Action Success */}
      {actionSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {actionSuccess}
        </div>
      )}

      {/* Action Error */}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Payment summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Payment Information
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500">Amount</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatAmount(payment.amount)}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Status</p>
              <p className="mt-1 font-medium text-gray-900">
                {payment.status || '—'}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Created</p>
              <p className="mt-1 text-gray-900">
                {formatDate(payment.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Submitted</p>
              <p className="mt-1 text-gray-900">
                {formatDate(payment.submittedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Student */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Student
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="mt-1 font-medium text-gray-900">
                {payment.student?.name || '—'}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Admission Number</p>
              <p className="mt-1 text-gray-900">
                {payment.student?.admissionNumber || '—'}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Student ID</p>
              <p className="mt-1 break-all text-gray-900">
                {payment.studentId ||
                  payment.student?.id ||
                  '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction information */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Transaction Information
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">UTR</p>
            <p className="mt-1 break-all text-sm text-gray-900">
              {payment.utr || '—'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Transaction Reference
            </p>
            <p className="mt-1 break-all text-sm text-gray-900">
              {payment.transactionReferenceId || '—'}
            </p>
          </div>
        </div>

        {payment.proofUrl && (
          <div className="mt-5">
            <p className="text-sm text-gray-500">Payment Proof</p>

            <a
              href={payment.proofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              View Payment Proof
            </a>
          </div>
        )}
      </div>

      {/* Receipt */}
      {payment.receipt && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Receipt
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">
                Receipt Number
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {payment.receipt.receiptNumber || '—'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formatAmount(payment.receipt.amount)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Issued</p>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(payment.receipt.issuedAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}