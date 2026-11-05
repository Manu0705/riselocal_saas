'use client';

import { useCallback, useEffect, useState } from 'react';
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

type ReceiptApiItem = {
  id?: string;
  receiptNumber?: string;
  receiptNo?: string;
  description?: string | null;
  amount?: number | string;
  date?: string | null;
  createdAt?: string | null;
  issuedAt?: string | null;
  downloadUrl?: string | null;
  payment?: {
    amount?: number | string;
    createdAt?: string | null;
    verifiedAt?: string | null;
    description?: string | null;
    method?: string | null;
    utr?: string | null;
    transactionReferenceId?: string | null;
    status?: string | null;
    student?: {
      name?: string | null;
      admissionNumber?: string | null;
    };
  };
};

type ReceiptApiResponse = {
  success?: boolean;
  data?: unknown;
  items?: unknown;
  receipts?: unknown;
  [key: string]: unknown;
};

function extractReceipts(value: unknown): ReceiptApiItem[] {
  let current: unknown = value;

  for (let i = 0; i < 5; i += 1) {
    if (Array.isArray(current)) {
      return current as ReceiptApiItem[];
    }

    if (!current || typeof current !== 'object') {
      return [];
    }

    const obj = current as Record<string, unknown>;

    if (Array.isArray(obj.items)) {
      return obj.items as ReceiptApiItem[];
    }

    if (Array.isArray(obj.receipts)) {
      return obj.receipts as ReceiptApiItem[];
    }

    if ('data' in obj) {
      current = obj.data;
      continue;
    }

    break;
  }

  return [];
}

function mapReceipt(item: ReceiptApiItem): StudentReceipt {
  const amount = Number(item.payment?.amount ?? item.amount ?? 0);

  const method = item.payment?.method;
  const utr =
    item.payment?.utr ?? item.payment?.transactionReferenceId;
  const admissionNumber = item.payment?.student?.admissionNumber;

  const description =
    item.description ??
    item.payment?.description ??
    [
      method || 'Hostel payment',
      utr ? `UTR: ${utr}` : null,
      admissionNumber ? `Admission: ${admissionNumber}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

  return {
    id: item.id ?? item.receiptNumber ?? item.receiptNo ?? '',
    receiptNumber:
      item.receiptNumber ?? item.receiptNo ?? item.id ?? 'N/A',
    description: description || 'Hostel payment',
    amount: Number.isFinite(amount) ? amount : 0,
    date:
      item.issuedAt ??
      item.date ??
      item.createdAt ??
      item.payment?.verifiedAt ??
      item.payment?.createdAt ??
      null,
    downloadUrl: item.downloadUrl ?? null,
  };
}

export default function ReceiptsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant')?.trim() || '';

  const [receipts, setReceipts] = useState<StudentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const logout = useCallback(() => {
    sessionStorage.removeItem('student_token');
    sessionStorage.removeItem('student_account');

    router.replace(
      `/student/login?tenant=${encodeURIComponent(tenantSlug)}`
    );
  }, [router, tenantSlug]);

  useEffect(() => {
    let cancelled = false;

    async function loadReceipts() {
      const token = sessionStorage.getItem('student_token');

      if (!token) {
        if (!cancelled) {
          logout();
        }
        return;
      }

      try {
        setLoading(true);
        setError('');

        const apiBaseUrl = (
          process.env.NEXT_PUBLIC_API_URL || ''
        ).replace(/\/+$/, '');

        const response = await fetch(
          `${apiBaseUrl}/api/hostel/receipts?page=1&limit=25`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
              ...(tenantSlug
                ? { 'x-tenant-slug': tenantSlug }
                : {}),
            },
            cache: 'no-store',
          }
        );

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'Your student session could not be authenticated. Please log in again if your session has expired.'
          );
        }

        if (!response.ok) {
          const responseText = await response.text();

          throw new Error(
            `Receipts API (${response.status}): ${
              responseText || response.statusText
            }`
          );
        }

        const result: ReceiptApiResponse = await response.json();
        const items = extractReceipts(result)
          .map(mapReceipt)
          .filter((receipt) => receipt.id);

        if (!cancelled) {
          setReceipts(items);
        }
      } catch (err) {
        if (!cancelled) {
          setReceipts([]);
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load receipts. Please try again.'
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
  }, [logout, refreshKey, tenantSlug]);

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
          View your hostel payment receipts.
        </p>

        <div className="mt-8 rounded-2xl border border-[#E7E2D8] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ReceiptText
                className="text-[#15563A]"
                size={22}
              />

              <h2 className="text-lg font-bold text-[#102033]">
                Your Receipts
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E7E2D8] px-3 py-2 text-xs font-bold text-[#536579] hover:bg-[#FCFCFB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-[#F1D1CE] bg-[#FFF5F3] p-4 text-sm text-[#A33A32]"
            >
              <p>{error}</p>

              <button
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                className="mt-3 inline-flex items-center gap-1 font-bold underline"
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
                  <div className="min-w-0">
                    <p className="break-all font-bold text-[#102033]">
                      Receipt #{receipt.receiptNumber}
                    </p>

                    <p className="mt-1 text-sm text-[#536579]">
                      {receipt.description}
                    </p>

                    <p className="mt-1 text-xs text-[#7A8794]">
                      {receipt.date &&
                      !Number.isNaN(Date.parse(receipt.date))
                        ? new Date(receipt.date).toLocaleDateString(
                            'en-IN',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )
                        : 'Date not available'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
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