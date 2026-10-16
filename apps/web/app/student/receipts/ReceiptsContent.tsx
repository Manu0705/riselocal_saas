'use client';

import { useEffect, useState } from 'react';
import { ReceiptText, Download, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentPortalHeader from '../StudentPortalHeader';

type StudentReceipt = {
  id: string;
  receiptNumber: string;
  description: string;
  amount: number;
  date?: string | null;
  downloadUrl?: string | null;
};

export default function ReceiptsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant')?.trim() || '';

  const [receipts, setReceipts] = useState<StudentReceipt[]>([]);
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

    async function loadReceipts() {
      try {
        setLoading(true);
        setError('');

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

        // Keep your existing receipts API endpoint.
        const response = await fetch(
          `${API_BASE_URL}/api/hostel/student/receipts`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Unable to load receipts.');
        }

        const result = await response.json();

        // Support array responses and { receipts: [...] } responses.
        const items = Array.isArray(result)
          ? result
          : Array.isArray(result?.receipts)
            ? result.receipts
            : [];

        if (!cancelled) {
          setReceipts(items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load receipts.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReceipts();

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
          Loading your receipts...
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
          Receipts
        </h1>

        <p className="mt-2 text-sm text-[#536579]">
          View and download your hostel payment receipts.
        </p>

        <div className="mt-8 rounded-2xl border border-[#E7E2D8] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ReceiptText className="text-[#15563A]" size={22} />

            <h2 className="text-lg font-bold text-[#102033]">
              Your Receipts
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

          {!error && receipts.length === 0 && (
            <p className="mt-5 rounded-xl bg-[#FCFCFB] p-5 text-sm text-[#536579]">
              No receipts are available yet.
            </p>
          )}

          {receipts.length > 0 && (
            <div className="mt-5 space-y-3">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex flex-col gap-4 rounded-xl border border-[#E7E2D8] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-[#102033]">
                      Receipt #{receipt.receiptNumber}
                    </p>

                    <p className="mt-1 text-sm text-[#536579]">
                      {receipt.description}
                    </p>

                    <p className="mt-1 text-xs text-[#7A8794]">
                      {receipt.date
                        ? new Date(receipt.date).toLocaleDateString('en-IN')
                        : 'Date not available'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <p className="font-bold text-[#15563A]">
                      {formatAmount(receipt.amount)}
                    </p>

                    {receipt.downloadUrl && (
                      <a
                        href={receipt.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#15563A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1F6B48]"
                      >
                        <Download size={15} />
                        Download
                      </a>
                    )}
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