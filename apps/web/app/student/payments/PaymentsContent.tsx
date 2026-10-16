 'use client';

import { useEffect, useState } from 'react';
import { BedDouble, LogOut, CreditCard, RefreshCw, ReceiptText, MessageSquareWarning, } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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

        // Replace this path with your actual payments API endpoint.
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

        // Adapt this mapping to your actual API response.
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
        if (!cancelled) setLoading(false);
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
      <header className="border-b border-[#E7E2D8] bg-white">
        {/* <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"> */}
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15563A] text-white">
              <BedDouble size={21} />
            </div>
            <div>
              <p className="text-sm font-black text-[#102033]">
                Student Portal
              </p>
              <p className="text-[11px] text-[#7A8794]">
                {tenantSlug}
              </p>
            </div>
</div>

<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
  {/* Student navigation menu */}
<nav
    aria-label="Student navigation"
    className="flex items-center gap-2 overflow-x-auto sm:gap-3"
  >
    <Link
      href={`/student/payments?tenant=${encodeURIComponent(tenantSlug)}`}
      className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#536579] transition hover:bg-[#F0F5F1] hover:text-[#15563A] sm:text-sm"
    >
      <CreditCard size={16} />
      Payments
    </Link>

    <Link
      href={`/student/receipts?tenant=${encodeURIComponent(tenantSlug)}`}
      className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#536579] transition hover:bg-[#F0F5F1] hover:text-[#15563A] sm:text-sm"
    >
      <ReceiptText size={16} />
      Receipts
    </Link>

    <Link
      href={`/student/complaints?tenant=${encodeURIComponent(tenantSlug)}`}
      className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#536579] transition hover:bg-[#F0F5F1] hover:text-[#15563A] sm:text-sm"
    >
      <MessageSquareWarning size={16} />
      Complaints
    </Link>
  </nav>

  {/* Logout button */}
  <button
    type="button"
    onClick={logout}
    className="flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#DCE2E5] bg-white px-3 py-2 text-xs font-bold text-[#536579] transition hover:bg-[#F7F3E9] lg:self-auto"
  >
    <LogOut size={15} />
    Logout
  </button>
</div>
        </div>
      </header>

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