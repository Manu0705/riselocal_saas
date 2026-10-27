'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  QrCode,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentPortalHeader from '../StudentPortalHeader';

type Payment = {
  id: string;
  description: string;
  amount: number;
  status: string;
  date?: string | null;
  currency?: string;
  method?: string | null;
  utr?: string | null;
  referenceNumber?: string | null;
  proofUrl?: string | null;
  upiVpa?: string | null;
  receipt?: {
    id?: string;
    receiptNumber?: string;
    receiptUrl?: string;
  } | null;
  metadata?: {
    payeeName?: string;
    [key: string]: unknown;
  } | null;
};

const PAYMENT_STEPS = [
  'INITIATED',
  'SUBMITTED',
  'VERIFYING',
  'PAID',
] as const;

const STATUS_STYLES: Record<string, string> = {
  INITIATED: 'bg-amber-50 text-amber-800 border-amber-200',
  SUBMITTED: 'bg-blue-50 text-blue-800 border-blue-200',
  VERIFYING: 'bg-violet-50 text-violet-800 border-violet-200',
  PAID: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  VERIFIED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-800 border-red-200',
  FAILED: 'bg-red-50 text-red-800 border-red-200',
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
};

function extractPayments(result: unknown): Payment[] {
  const response = result as Record<string, unknown> | null;
  const payload = (response?.data ?? result) as
    | Record<string, unknown>
    | Payment[]
    | null;

  const items = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as Record<string, unknown>)?.items)
      ? (payload as Record<string, unknown>).items as unknown[]
      : Array.isArray((payload as Record<string, unknown>)?.payments)
        ? (payload as Record<string, unknown>).payments as unknown[]
        : [];

  return items.map((value) => {
    const item = value as Record<string, unknown>;
    const student = item.student as
      | Record<string, unknown>
      | undefined;

    return {
      id: String(item.id ?? ''),
      description: String(
        item.description ??
          item.feeDescription ??
          student?.name ??
          'Hostel fee payment'
      ),
      amount: Number(item.amount ?? 0),
      status: String(item.status ?? 'UNKNOWN').toUpperCase(),
      date: (item.createdAt ?? item.date ?? null) as string | null,
      currency: String(item.currency ?? 'INR'),
      method: item.method ? String(item.method) : null,
      utr: item.utr ? String(item.utr) : null,
      referenceNumber: item.referenceNumber
        ? String(item.referenceNumber)
        : null,
      proofUrl: item.proofUrl ? String(item.proofUrl) : null,
      upiVpa: item.upiVpa ? String(item.upiVpa) : null,
      receipt: item.receipt
        ? (item.receipt as Payment['receipt'])
        : null,
      metadata: item.metadata
        ? (item.metadata as Payment['metadata'])
        : null,
    };
  });
}

function formatAmount(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date?: string | null) {
  if (!date) return 'Date not available';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Date not available';

  return parsed.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getStatusDescription(status: string) {
  switch (status) {
    case 'INITIATED':
      return 'Payment request created. Complete your UPI payment and submit the reference number.';
    case 'SUBMITTED':
      return 'Your payment details have been submitted for review.';
    case 'VERIFYING':
      return 'The hostel team is verifying your payment.';
    case 'PAID':
    case 'VERIFIED':
      return 'Your payment has been verified.';
    case 'REJECTED':
      return 'Your payment submission was rejected. Contact the hostel office for assistance.';
    case 'FAILED':
      return 'This payment attempt failed. Please contact the hostel office before trying again.';
    default:
      return 'Check with the hostel office for the latest payment information.';
  }
}

async function readResponse(response: Response) {
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ??
        result?.error ??
        `Request failed (${response.status}).`
    );
  }

  return result;
}

export default function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant')?.trim() || '';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  const getHeaders = useCallback(() => {
    const token = sessionStorage.getItem('student_token');

    return {
      Accept: 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
      ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
    };
  }, [tenantSlug]);

  const loadPayments = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const response = await fetch('/api/hostel/payments', {
          method: 'GET',
          headers: getHeaders(),
          cache: 'no-store',
        });

        const result = await readResponse(response);
        const items = extractPayments(result);

        setPayments(items);

        setSelectedPaymentId((current) => {
          if (current && items.some((payment) => payment.id === current)) {
            return current;
          }

          const actionable = items.find((payment) =>
            ['INITIATED', 'PENDING'].includes(payment.status)
          );

          return actionable?.id ?? '';
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load payments.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getHeaders]
  );

  useEffect(() => {
    const token = sessionStorage.getItem('student_token');

    if (!token) {
      router.replace(
        `/student/login?tenant=${encodeURIComponent(tenantSlug)}`
      );
      return;
    }

    void loadPayments();
  }, [router, tenantSlug, loadPayments]);

  const logout = () => {
    sessionStorage.removeItem('student_token');
    sessionStorage.removeItem('student_account');

    router.replace(
      `/student/login?tenant=${encodeURIComponent(tenantSlug)}`
    );
  };

  const initiatePayment = async () => {
    const requestedAmount = Number(amount);

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      setActionError('Enter a valid payment amount.');
      return;
    }

    setCreatingPayment(true);
    setActionError('');
    setSuccess('');

    try {
      const response = await fetch('/api/hostel/payments', {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: requestedAmount,
          method: 'UPI',
        }),
      });

      const result = await readResponse(response);
      const payload = result?.data ?? result;
      const payment = payload?.payment ?? payload;

      if (!payment?.id) {
        throw new Error(
          'The payment request was accepted, but no payment ID was returned. Refresh your payment history.'
        );
      }

      setAmount('');
      setSelectedPaymentId(String(payment.id));
      setSuccess('Payment request created. Complete your UPI payment below.');
      await loadPayments(true);
      setSelectedPaymentId(String(payment.id));
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Unable to initiate payment.'
      );
    } finally {
      setCreatingPayment(false);
    }
  };

  const submitPayment = async (payment: Payment) => {
    const reference = utr.trim();

    if (!reference) {
      setActionError('Enter the UTR or transaction reference number.');
      return;
    }

    if (!/^[a-zA-Z0-9-]{6,40}$/.test(reference)) {
      setActionError('Enter a valid transaction reference number.');
      return;
    }

    setSubmittingPayment(true);
    setActionError('');
    setSuccess('');

    try {
      let proofUrl: string | undefined;

      if (proofFile) {
        throw new Error(
          'Proof upload is not connected yet. Submit your UTR now, or connect a secure file-upload endpoint before enabling attachments.'
        );
      }

      const idempotencyKey = crypto.randomUUID();

      const response = await fetch(
        `/api/hostel/payments/${encodeURIComponent(payment.id)}/submit`,
        {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            idempotencyKey: idempotencyKey,
            utr: reference,
            transactionReferenceId: reference,
          }),
        }
      );

      await readResponse(response);

      setUtr('');
      setProofFile(null);
      setSuccess(
        'Payment details submitted. Your hostel team must verify the payment before it is marked as paid.'
      );

      await loadPayments(true);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Unable to submit payment details.'
      );
    } finally {
      setSubmittingPayment(false);
    }
  };

  const selectedPayment = payments.find(
    (payment) => payment.id === selectedPaymentId
  );

  const canSubmit = (payment: Payment) =>
    ['INITIATED', 'PENDING'].includes(payment.status);

  const getTimelineIndex = (status: string) => {
    if (status === 'VERIFIED' || status === 'PAID') return 3;
    if (status === 'VERIFYING') return 2;
    if (status === 'SUBMITTED') return 1;
    return 0;
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
        <Loader2 className="mr-2 animate-spin text-[#15563A]" size={20} />
        <p className="text-sm text-[#536579]">Loading your payments...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFAF7]">
      <StudentPortalHeader tenantSlug={tenantSlug} onLogout={logout} />

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B27A17]">
          My Account
        </p>

        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#102033]">
              Payments
            </h1>
            <p className="mt-2 text-sm text-[#536579]">
              Pay your hostel fees and track your payment verification.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPayments(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E7E2D8] bg-white px-4 py-2.5 text-sm font-semibold text-[#102033] disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh status
          </button>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#F1D1CE] bg-[#FFF5F3] p-4 text-sm text-[#A33A32]">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              {error}
              <button
                type="button"
                onClick={() => void loadPayments()}
                className="ml-2 font-bold underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {actionError && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#F1D1CE] bg-[#FFF5F3] p-4 text-sm text-[#A33A32]">
            <AlertCircle size={18} className="shrink-0" />
            <p>{actionError}</p>
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 size={18} className="shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-[#E7E2D8] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="text-[#15563A]" size={22} />
            <div>
              <h2 className="text-lg font-bold text-[#102033]">
                Make a payment
              </h2>
              <p className="mt-1 text-sm text-[#536579]">
                Create a UPI payment request for your hostel fees.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#102033]">
                Payment amount (₹)
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-xl border border-[#DADFD9] bg-white px-4 py-3 text-sm text-[#102033] outline-none focus:border-[#15563A] focus:ring-2 focus:ring-[#15563A]/10"
              />
            </label>

            <button
              type="button"
              onClick={() => void initiatePayment()}
              disabled={creatingPayment}
              className="self-end rounded-xl bg-[#15563A] px-5 py-3 text-sm font-bold text-white hover:bg-[#10452E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingPayment ? 'Creating request...' : 'Pay with UPI'}
            </button>
          </div>

          <p className="mt-3 text-xs leading-5 text-[#7A8794]">
            Confirm your actual outstanding fee before creating a payment.
            Do not create duplicate requests for the same fee.
          </p>
        </section>

        {selectedPayment && (
          <section className="mt-6 rounded-2xl border border-[#E7E2D8] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B27A17]">
                  UPI payment request
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#102033]">
                  {formatAmount(
                    selectedPayment.amount,
                    selectedPayment.currency
                  )}
                </h2>
                <p className="mt-1 text-sm text-[#536579]">
                  {selectedPayment.description}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                  STATUS_STYLES[selectedPayment.status] ??
                  'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              >
                {selectedPayment.status}
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-[#E7E2D8] bg-[#FCFCFB] p-4">
              <div className="flex items-center gap-2">
                <QrCode size={19} className="text-[#15563A]" />
                <h3 className="font-bold text-[#102033]">
                  Pay using any UPI app
                </h3>
              </div>

              <p className="mt-2 text-sm leading-6 text-[#536579]">
                Use the hostel&apos;s configured UPI ID or scan its official
                QR code. Google Pay, PhonePe, Paytm and BHIM are compatible
                when supported by your UPI app and device.
              </p>

              {selectedPayment.upiVpa ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#7A8794]">Hostel UPI ID</p>
                    <p className="mt-1 break-all font-semibold text-[#102033]">
                      {selectedPayment.upiVpa}
                    </p>
                    {selectedPayment.metadata?.payeeName && (
                      <p className="mt-1 text-xs text-[#536579]">
                        Payee: {selectedPayment.metadata.payeeName}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(selectedPayment.upiVpa ?? '')
                        .then(() => setSuccess('UPI ID copied.'))
                        .catch(() =>
                          setActionError(
                            'Unable to copy the UPI ID. Please copy it manually.'
                          )
                        );
                    }}
                    className="rounded-lg border border-[#DADFD9] bg-white px-4 py-2 text-sm font-semibold text-[#15563A]"
                  >
                    Copy UPI ID
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm font-medium text-amber-800">
                  The hostel UPI ID is not available in this payment record.
                  Contact the hostel office to confirm the correct payment
                  details before transferring money.
                </p>
              )}

              <p className="mt-4 text-xs leading-5 text-[#7A8794]">
                Only pay to a UPI ID or QR code confirmed by your hostel.
                Returning here or uploading proof does not mark the payment
                as paid.
              </p>
            </div>

            {canSubmit(selectedPayment) && (
              <div className="mt-6">
                <h3 className="font-bold text-[#102033]">
                  I&apos;ve completed payment
                </h3>
                <p className="mt-1 text-sm text-[#536579]">
                  Enter the UTR/reference number from your UPI transaction.
                </p>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-semibold text-[#102033]">
                    UTR / transaction reference
                  </span>
                  <input
                    value={utr}
                    onChange={(event) => setUtr(event.target.value)}
                    maxLength={40}
                    placeholder="Enter your transaction reference"
                    className="w-full rounded-xl border border-[#DADFD9] px-4 py-3 text-sm outline-none focus:border-[#15563A] focus:ring-2 focus:ring-[#15563A]/10"
                  />
                </label>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-semibold text-[#102033]">
                    Payment screenshot (optional)
                  </span>
                  <span className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#DADFD9] p-4">
                    <Upload size={19} className="text-[#15563A]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[#102033]">
                        {proofFile ? proofFile.name : 'Choose payment proof'}
                      </span>
                      <span className="mt-1 block text-xs text-[#7A8794]">
                        PNG, JPG or PDF, up to 5 MB
                      </span>
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (!file) {
                          setProofFile(null);
                          return;
                        }

                        if (file.size > 5 * 1024 * 1024) {
                          setActionError('Proof file must be 5 MB or smaller.');
                          setProofFile(null);
                          event.target.value = '';
                          return;
                        }

                        setActionError('');
                        setProofFile(file);
                      }}
                    />
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => void submitPayment(selectedPayment)}
                  disabled={submittingPayment}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#15563A] px-5 py-3 font-bold text-white hover:bg-[#10452E] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {submittingPayment && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {submittingPayment
                    ? 'Submitting...'
                    : "I've completed payment"}
                </button>
              </div>
            )}

            <div className="mt-7 border-t border-[#E7E2D8] pt-6">
              <h3 className="font-bold text-[#102033]">
                Payment status timeline
              </h3>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {PAYMENT_STEPS.map((step, index) => {
                  const active =
                    getTimelineIndex(selectedPayment.status) >= index;
                  const current = selectedPayment.status === step;

                  return (
                    <div key={step} className="flex items-start gap-2">
                      {active ? (
                        <CheckCircle2
                          size={19}
                          className="mt-0.5 shrink-0 text-[#15563A]"
                        />
                      ) : (
                        <Clock3
                          size={19}
                          className="mt-0.5 shrink-0 text-[#B7BFC5]"
                        />
                      )}
                      <div>
                        <p
                          className={`text-xs font-bold ${
                            active ? 'text-[#15563A]' : 'text-[#7A8794]'
                          }`}
                        >
                          {step}
                        </p>
                        {current && (
                          <p className="mt-1 text-[11px] text-[#536579]">
                            Current
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 rounded-xl bg-[#FCFCFB] p-4 text-sm leading-6 text-[#536579]">
                {getStatusDescription(selectedPayment.status)}
              </p>

              {['REJECTED', 'FAILED'].includes(selectedPayment.status) && (
                <p className="mt-3 text-sm text-[#A33A32]">
                  Contact your hostel administrator before making another
                  payment, to avoid duplicate transfers.
                </p>
              )}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-[#E7E2D8] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <FileText className="text-[#15563A]" size={22} />
            <h2 className="text-lg font-bold text-[#102033]">
              Payment History
            </h2>
          </div>

          {!error && payments.length === 0 && (
            <p className="mt-5 rounded-xl bg-[#FCFCFB] p-5 text-sm text-[#536579]">
              No payment records are available yet. Create a payment request
              above when you have a fee amount to pay.
            </p>
          )}

          {payments.length > 0 && (
            <div className="mt-5 space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#E7E2D8] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#102033]">
                      {payment.description}
                    </p>
                    <p className="mt-1 text-xs text-[#7A8794]">
                      {formatDate(payment.date)}
                    </p>
                    {payment.utr && (
                      <p className="mt-1 break-all text-xs text-[#536579]">
                        UTR: {payment.utr}
                      </p>
                    )}
                    {payment.receipt?.receiptNumber && (
                      <p className="mt-1 text-xs font-medium text-emerald-800">
                        Receipt: {payment.receipt.receiptNumber}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="sm:text-right">
                      <p className="font-bold text-[#102033]">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                          STATUS_STYLES[payment.status] ??
                          'border-gray-200 bg-gray-50 text-gray-700'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPaymentId(payment.id);
                        setActionError('');
                        setSuccess('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="rounded-lg border border-[#DADFD9] px-3 py-2 text-xs font-semibold text-[#15563A]"
                    >
                      View
                    </button>

                    {payment.receipt?.receiptUrl && (
                      <a
                        href={payment.receipt.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#15563A] underline"
                      >
                        Receipt <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-6 text-xs leading-5 text-[#7A8794]">
          Payments remain pending until verified by the hostel team. Never
          share your UPI PIN or OTP with anyone.
        </p>
      </div>
    </main>
  );
}
