'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type Student = {
  id: string;
  name: string;
  admissionNumber?: string | null;
};

type Invoice = {
  id: string;
  invoiceNumber?: string | null;
  totalAmount?: number | string | null;
  paidAmount?: number | string | null;
  balanceAmount?: number | string | null;
  status?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
};

type InvoiceAllocation = {
  invoice?: Invoice | null;
};

type Payment = {
  id: string;
  studentId: string;
  amount?: number | string | null;
  currency?: string | null;
  method?: string | null;
  utr?: string | null;
  transactionReferenceId?: string | null;
  status?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  student?: Student | null;
  invoiceAllocations?: InvoiceAllocation[];
};

type Receipt = {
  id: string;
  receiptNumber: string;
  paymentId: string;
  issuedAt: string;
  metadata?: unknown;
  payment?: Payment | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ReceiptListResponse = {
  items: Receipt[];
  pagination: Pagination;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const PAGE_LIMIT = 10;

function formatCurrency(
  value: number | string | null | undefined,
  currency = 'INR',
) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status?: string | null) {
  if (!status) return '—';

  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status?: string | null) {
  return (status ?? 'unknown').toLowerCase();
}

export default function HostelReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedReceipt, setSelectedReceipt] =
    useState<Receipt | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  async function loadReceipts() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await api.get<
        ApiResponse<ReceiptListResponse>
      >(`/hostel/receipts?${params.toString()}`);

      setReceipts(response.data?.items ?? []);
      setPagination(response.data?.pagination ?? null);
    } catch (err) {
      setReceipts([]);
      setPagination(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load receipts.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReceipts();
  }, [page, search]);

  function handleSearchSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput('');
    setSearch('');
    setPage(1);
  }

  async function openReceipt(receipt: Receipt) {
    setLoadingDetails(true);
    setError('');

    try {
      const response = await api.get<
        ApiResponse<Receipt>
      >(
        `/hostel/receipts/${encodeURIComponent(
          receipt.id,
        )}`,
      );

      setSelectedReceipt(response.data ?? receipt);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load receipt details.',
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeReceipt() {
    if (loadingDetails) return;

    setSelectedReceipt(null);
  }

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="receipts-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">Hostel Finance</div>

          <h1>Receipts &amp; OCR</h1>

          <p>
            View payment receipts and inspect their transaction
            details.
          </p>
        </div>

        <div className="receipt-summary">
          <span>Total Receipts</span>
          <strong>
            {pagination?.total ?? 0}
          </strong>
        </div>
      </header>

      <section className="toolbar">
        <form
          className="search-form"
          onSubmit={handleSearchSubmit}
        >
          <div className="search-box">
            <span className="search-icon">⌕</span>

            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search receipt, student, UTR..."
              aria-label="Search receipts"
            />

            {searchInput && (
              <button
                type="button"
                className="clear-search"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="submit"
            className="primary-button"
          >
            Search
          </button>
        </form>
      </section>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <section className="table-card">
        {loading ? (
          <div className="empty-state">
            Loading receipts...
          </div>
        ) : receipts.length === 0 ? (
          <div className="empty-state">
            <strong>No receipts found</strong>

            <span>
              Verified payments will appear here once receipts
              are generated.
            </span>
          </div>
        ) : (
          <>
            <div className="desktop-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Student</th>
                    <th>Payment</th>
                    <th>Method</th>
                    <th>Issued</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {receipts.map((receipt) => {
                    const payment = receipt.payment;
                    const student = payment?.student;

                    return (
                      <tr key={receipt.id}>
                        <td>
                          <div className="primary-text">
                            {receipt.receiptNumber}
                          </div>

                          <div className="secondary-text">
                            {receipt.paymentId}
                          </div>
                        </td>

                        <td>
                          <div className="primary-text">
                            {student?.name ??
                              payment?.studentId ??
                              '—'}
                          </div>

                          {student?.admissionNumber && (
                            <div className="secondary-text">
                              {student.admissionNumber}
                            </div>
                          )}
                        </td>

                        <td className="amount">
                          {formatCurrency(
                            payment?.amount,
                            payment?.currency ?? 'INR',
                          )}
                        </td>

                        <td>
                          {payment?.method
                            ? statusLabel(payment.method)
                            : '—'}
                        </td>

                        <td>
                          {formatDate(receipt.issuedAt)}
                        </td>

                        <td>
                          <span
                            className={`status ${statusClass(
                              payment?.status,
                            )}`}
                          >
                            {statusLabel(payment?.status)}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              void openReceipt(receipt)
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-list">
              {receipts.map((receipt) => {
                const payment = receipt.payment;
                const student = payment?.student;

                return (
                  <article
                    className="receipt-card"
                    key={receipt.id}
                  >
                    <div className="receipt-card-header">
                      <div>
                        <h3>
                          {receipt.receiptNumber}
                        </h3>

                        <p>
                          {student?.name ??
                            payment?.studentId ??
                            '—'}
                        </p>

                        {student?.admissionNumber && (
                          <p>
                            {student.admissionNumber}
                          </p>
                        )}
                      </div>

                      <span
                        className={`status ${statusClass(
                          payment?.status,
                        )}`}
                      >
                        {statusLabel(payment?.status)}
                      </span>
                    </div>

                    <div className="receipt-details">
                      <div>
                        <span>Amount</span>
                        <strong>
                          {formatCurrency(
                            payment?.amount,
                            payment?.currency ?? 'INR',
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Issued</span>
                        <strong>
                          {formatDate(receipt.issuedAt)}
                        </strong>
                      </div>

                      <div>
                        <span>Method</span>
                        <strong>
                          {payment?.method
                            ? statusLabel(payment.method)
                            : '—'}
                        </strong>
                      </div>

                      <div>
                        <span>UTR</span>
                        <strong>
                          {payment?.utr ?? '—'}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="secondary-button full-button"
                      onClick={() =>
                        void openReceipt(receipt)
                      }
                    >
                      View Receipt
                    </button>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {!loading &&
          pagination &&
          pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="secondary-button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="secondary-button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1,
                    ),
                  )
                }
              >
                Next
              </button>
            </div>
          )}
      </section>

      {selectedReceipt && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReceipt();
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-detail-title"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  Payment Receipt
                </div>

                <h2 id="receipt-detail-title">
                  {selectedReceipt.receiptNumber}
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeReceipt}
                disabled={loadingDetails}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {loadingDetails ? (
                <div className="detail-loading">
                  Loading receipt details...
                </div>
              ) : (
                <>
                  <div className="detail-section">
                    <h3>Receipt Information</h3>

                    <div className="detail-grid">
                      <div>
                        <span>Receipt Number</span>
                        <strong>
                          {
                            selectedReceipt.receiptNumber
                          }
                        </strong>
                      </div>

                      <div>
                        <span>Issued At</span>
                        <strong>
                          {formatDateTime(
                            selectedReceipt.issuedAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Payment ID</span>
                        <strong>
                          {
                            selectedReceipt.paymentId
                          }
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Student</h3>

                    <div className="detail-grid">
                      <div>
                        <span>Name</span>
                        <strong>
                          {selectedReceipt.payment
                            ?.student?.name ?? '—'}
                        </strong>
                      </div>

                      <div>
                        <span>Admission Number</span>
                        <strong>
                          {selectedReceipt.payment
                            ?.student
                            ?.admissionNumber ?? '—'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Payment</h3>

                    <div className="detail-grid">
                      <div>
                        <span>Amount</span>
                        <strong>
                          {formatCurrency(
                            selectedReceipt.payment
                              ?.amount,
                            selectedReceipt.payment
                              ?.currency ?? 'INR',
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Method</span>
                        <strong>
                          {selectedReceipt.payment
                            ?.method
                            ? statusLabel(
                                selectedReceipt
                                  .payment.method,
                              )
                            : '—'}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong>
                          {statusLabel(
                            selectedReceipt.payment
                              ?.status,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>UTR</span>
                        <strong>
                          {selectedReceipt.payment
                            ?.utr ?? '—'}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Transaction Reference
                        </span>
                        <strong>
                          {selectedReceipt.payment
                            ?.transactionReferenceId ??
                            '—'}
                        </strong>
                      </div>

                      <div>
                        <span>Verified At</span>
                        <strong>
                          {formatDateTime(
                            selectedReceipt.payment
                              ?.verifiedAt,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Invoice Allocations</h3>

                    {selectedReceipt.payment
                      ?.invoiceAllocations?.length ? (
                      <div className="allocation-list">
                        {selectedReceipt.payment.invoiceAllocations.map(
                          (allocation, index) => {
                            const invoice =
                              allocation.invoice;

                            return (
                              <div
                                className="allocation"
                                key={
                                  invoice?.id ??
                                  index
                                }
                              >
                                <div>
                                  <strong>
                                    {invoice
                                      ?.invoiceNumber ??
                                      'Invoice'}
                                  </strong>

                                  <span>
                                    Status:{' '}
                                    {statusLabel(
                                      invoice?.status,
                                    )}
                                  </span>
                                </div>

                                <strong>
                                  {formatCurrency(
                                    invoice
                                      ?.totalAmount,
                                  )}
                                </strong>
                              </div>
                            );
                          },
                        )}
                      </div>
                    ) : (
                      <div className="no-data">
                        No invoice allocation information
                        available.
                      </div>
                    )}
                  </div>

                  <div className="ocr-note">
                    <strong>OCR</strong>

                    <span>
                      Receipt OCR is currently represented
                      through the existing receipt/payment
                      metadata. No separate OCR mutation
                      endpoint is exposed by the current
                      backend contract.
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeReceipt}
                disabled={loadingDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .receipts-page {
          width: 100%;
          min-width: 0;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        h1 {
          margin: 4px 0 0;
          color: var(--foreground, #111827);
          font-size: 28px;
          line-height: 1.2;
          font-weight: 700;
        }

        .page-header p {
          margin: 8px 0 0;
          color: var(--muted, #6b7280);
          font-size: 14px;
        }

        .receipt-summary {
          display: flex;
          min-width: 130px;
          padding: 12px 16px;
          flex-direction: column;
          gap: 3px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 10px;
          background: var(--bg, #ffffff);
        }

        .receipt-summary span {
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .receipt-summary strong {
          color: var(--foreground, #111827);
          font-size: 20px;
        }

        button {
          font: inherit;
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .primary-button {
          min-height: 40px;
          padding: 0 15px;
          border: 0;
          border-radius: 8px;
          background: var(--primary, #2563eb);
          color: var(--primary-foreground, #ffffff);
          font-size: 13px;
          font-weight: 600;
        }

        .toolbar {
          display: flex;
          padding: 14px;
          margin-bottom: 16px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
          background: var(--bg, #ffffff);
        }

        .search-form {
          display: flex;
          width: 100%;
          gap: 8px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--muted, #6b7280);
          font-size: 18px;
        }

        .search-box input {
          width: 100%;
          height: 40px;
          box-sizing: border-box;
          padding: 0 38px 0 36px;
          border: 1px solid var(--border, #d1d5db);
          border-radius: 8px;
          background: var(--bg, #ffffff);
          color: var(--foreground, #111827);
          font: inherit;
          outline: none;
        }

        .search-box input:focus {
          border-color: var(--primary, #2563eb);
        }

        .clear-search {
          position: absolute;
          right: 8px;
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: var(--muted, #6b7280);
          font-size: 20px;
        }

        .error-message {
          margin-bottom: 16px;
          padding: 12px 14px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
          background: var(--bg, #ffffff);
          color: #b91c1c;
          font-size: 13px;
        }

        .table-card {
          overflow: hidden;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
          background: var(--bg, #ffffff);
        }

        .desktop-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 14px 18px;
          text-align: left;
          border-bottom: 1px solid var(--border, #e5e7eb);
          font-size: 13px;
        }

        th {
          color: var(--muted, #6b7280);
          font-size: 12px;
          font-weight: 600;
        }

        td {
          color: var(--foreground, #374151);
        }

        tbody tr:last-child td {
          border-bottom: 0;
        }

        .primary-text {
          color: var(--foreground, #111827);
          font-weight: 600;
        }

        .secondary-text {
          margin-top: 4px;
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .amount {
          font-weight: 600;
          white-space: nowrap;
        }

        .status {
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          padding: 0 9px;
          border-radius: 999px;
          background: var(--border, #f3f4f6);
          color: var(--muted, #6b7280);
          font-size: 11px;
          font-weight: 600;
        }

        .status.paid,
        .status.verified {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .status.submitted,
        .status.verify,
        .status.verifying {
          background: var(--border, #f3f4f6);
          color: var(--foreground, #374151);
        }

        .status.rejected,
        .status.failed {
          color: #b91c1c;
        }

        .text-button {
          border: 0;
          background: transparent;
          color: var(--primary, #2563eb);
          font-size: 12px;
          font-weight: 600;
        }

        .empty-state {
          display: flex;
          align-items: center;
          flex-direction: column;
          gap: 6px;
          padding: 48px 20px;
          color: var(--muted, #6b7280);
          text-align: center;
          font-size: 13px;
        }

        .empty-state strong {
          color: var(--foreground, #111827);
          font-size: 14px;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 16px;
          border-top: 1px solid var(--border, #e5e7eb);
          color: var(--muted, #6b7280);
          font-size: 12px;
        }

        .secondary-button {
          min-height: 40px;
          padding: 0 13px;
          border: 1px solid var(--border, #d1d5db);
          border-radius: 8px;
          background: var(--bg, #ffffff);
          color: var(--foreground, #374151);
          font-size: 13px;
          font-weight: 600;
        }

        .mobile-list {
          display: none;
        }

        .receipt-card {
          padding: 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .receipt-card:last-child {
          border-bottom: 0;
        }

        .receipt-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .receipt-card h3 {
          margin: 0;
          color: var(--foreground, #111827);
          font-size: 15px;
          font-weight: 650;
        }

        .receipt-card p {
          margin: 4px 0 0;
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .receipt-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .receipt-details div {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 4px;
        }

        .receipt-details span {
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .receipt-details strong {
          overflow: hidden;
          color: var(--foreground, #111827);
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .full-button {
          width: 100%;
          margin-top: 16px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.35);
        }

        .modal {
          width: min(650px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
          background: var(--bg, #ffffff);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .modal-header h2 {
          margin: 4px 0 0;
          color: var(--foreground, #111827);
          font-size: 20px;
        }

        .close-button {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: var(--muted, #6b7280);
          font-size: 24px;
        }

        .modal-content {
          padding: 20px;
        }

        .detail-section {
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .detail-section:last-of-type {
          border-bottom: 0;
          margin-bottom: 0;
        }

        .detail-section h3 {
          margin: 0 0 12px;
          color: var(--foreground, #111827);
          font-size: 14px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .detail-grid div {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 4px;
        }

        .detail-grid span {
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .detail-grid strong {
          overflow-wrap: anywhere;
          color: var(--foreground, #111827);
          font-size: 13px;
        }

        .allocation-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .allocation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
        }

        .allocation div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .allocation strong {
          color: var(--foreground, #111827);
          font-size: 13px;
        }

        .allocation span {
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .no-data {
          color: var(--muted, #6b7280);
          font-size: 12px;
        }

        .ocr-note {
          display: flex;
          padding: 12px;
          flex-direction: column;
          gap: 5px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
          background: var(--bg, #ffffff);
        }

        .ocr-note strong {
          color: var(--foreground, #111827);
          font-size: 12px;
        }

        .ocr-note span {
          color: var(--muted, #6b7280);
          font-size: 11px;
          line-height: 1.5;
        }

        .detail-loading {
          padding: 30px;
          color: var(--muted, #6b7280);
          text-align: center;
          font-size: 13px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          padding: 16px 20px;
          border-top: 1px solid var(--border, #e5e7eb);
        }

        @media (max-width: 700px) {
          .desktop-table-wrapper {
            display: none;
          }

          .mobile-list {
            display: block;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .page-header {
            flex-direction: column;
          }

          .receipt-summary {
            width: 100%;
            box-sizing: border-box;
          }

          .search-form {
            flex-direction: column;
          }

          .search-form .primary-button {
            width: 100%;
          }

          .modal-backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .modal {
            max-height: 92vh;
            border-radius: 14px 14px 0 0;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}