'use client';

import { useEffect, useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentPortalHeader from '../StudentPortalHeader';

type Payment = {
  id: string;
  description: string;
  amount: number;
  status: string;
  date?: string | null;
};

export default function PaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant')?.trim() || '';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('student_token');

    if (!token) {
      router.replace(
        `/student/login?tenant=${encodeURIComponent(tenantSlug)}`
      );
      return;
    }

    let cancelled = false;

    async function loadPayments() {
      try {
        setLoading(true);
        setError('');

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

        // Keep your existing payments API endpoint.
        const response = await fetch(
          `${API_BASE_URL}/api/hostel/student/payments`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Unable to load payments.');
        }

        const result = await response.json();

        // Support both array responses and { payments: [...] } responses.
        const items = Array.isArray(result)
          ? result
          : Array.isArray(result?.payments)
            ? result.payments
            : [];

        if (!cancelled) {
          setPayments(items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load payments.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPayments();

    return () => {
      cancelled = true;
    };
  }, [router, tenantSlug]);

  const logout = () => {
    sessionStorage.removeItem('student_token');
    sessionStorage.removeItem('student_account');

    router.replace(
      `/student/login?tenant=${encodeURIComponent(tenantSlug)}`
    );
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7]">
        <p className="text-sm text-[#536579]">
          Loading your payments...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFAF7]">
      <StudentPortalHeader
        tenantSlug={tenantSlug}
        onLogout={logout}
      />

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B27A17]">
          My Account
        </p>

        <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-[#102033]">
          Payments
        </h1>

        <p className="mt-2 text-sm text-[#536579]">
          View your hostel fee payments and payment status.
        </p>

        <div className="mt-8 rounded-2xl border border-[#E7E2D8] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CreditCard className="text-[#15563A]" size={22} />

            <h2 className="text-lg font-bold text-[#102033]">
              Payment History
            </h2>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-[#F1D1CE] bg-[#FFF5F3] p-4 text-sm text-[#A33A32]">
              {error}

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="ml-2 inline-flex items-center gap-1 font-bold underline"
              >
                <RefreshCw size={13} />
                Retry
              </button>
            </div>
          )}

          {!error && payments.length === 0 && (
            <p className="mt-5 rounded-xl bg-[#FCFCFB] p-5 text-sm text-[#536579]">
              No payment records are available yet.
            </p>
          )}

          {payments.length > 0 && (
            <div className="mt-5 space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#E7E2D8] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#102033]">
                      {payment.description}
                    </p>

                    <p className="mt-1 text-xs text-[#7A8794]">
                      {payment.date
                        ? new Date(payment.date).toLocaleDateString('en-IN')
                        : 'Date not available'}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-bold text-[#102033]">
                      {formatAmount(payment.amount)}
                    </p>

                    <span className="text-xs font-semibold text-[#15563A]">
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
