'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type Student = {
  id: string;
  name: string;
  admissionNumber?: string | null;
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
  receiptId?: string | null;
  initiatedAt?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  rejectedReason?: string | null;
  student?: Student | null;
};

type ReconciliationItem = Payment & {
  reconciled?: boolean;
  reconciliationStatus?: string | null;
  reconciledAt?: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type ReconciliationResponse = {
  items: ReconciliationItem[];
  pagination: Pagination;
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

function statusLabel(value?: string | null) {
  if (!value) return '—';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value?: string | null) {
  return (value ?? 'unknown').toLowerCase();
}

function getReconciliationStatus(
  item: ReconciliationItem,
) {
  if (item.reconciliationStatus) {
    return item.reconciliationStatus;
  }

  if (item.reconciled === true) {
    return 'RECONCILED';
  }

  if (item.status === 'PAID') {
    return 'PENDING';
  }

  return item.status ?? 'PENDING';
}

export default function HostelReconciliationPage() {
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedItem, setSelectedItem] =
    useState<ReconciliationItem | null>(null);

  async function loadReconciliation() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await api.get<
        ApiResponse<ReconciliationResponse>
      >(
        `/hostel/reconciliation/payments?${params.toString()}`,
      );

      setItems(response.data?.items ?? []);
      setPagination(response.data?.pagination ?? null);
    } catch (err) {
      setItems([]);
      setPagination(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load reconciliation data.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReconciliation();
  }, [page, statusFilter, search]);

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

  function openDetails(item: ReconciliationItem) {
    setSelectedItem(item);
  }

  function closeDetails() {
    setSelectedItem(null);
  }

  const totalPages = pagination?.totalPages ?? 1;

  const reconciledCount = items.filter(
    (item) =>
      getReconciliationStatus(item).toUpperCase() ===
      'RECONCILED',
  ).length;

  const pendingCount = items.filter(
    (item) =>
      getReconciliationStatus(item).toUpperCase() ===
      'PENDING',
  ).length;

  return (
    <div className="reconciliation-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">Hostel Finance</div>

          <h1>Reconciliation</h1>

          <p>
            Review hostel payments and reconciliation status.
          </p>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <span>Total</span>
            <strong>
              {pagination?.total ?? 0}
            </strong>
          </div>

          <div className="summary-card">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="summary-card">
            <span>Reconciled</span>
            <strong>{reconciledCount}</strong>
          </div>
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
              placeholder="Search student, UTR, transaction..."
              aria-label="Search reconciliation records"
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

        <div className="filter-group">
          {[
            'ALL',
            'PAID',
            'SUBMITTED',
            'VERIFYING',
            'REJECTED',
          ].map((status) => (
            <button
              key={status}
              type="button"
              className={
                statusFilter === status
                  ? 'filter-button active'
                  : 'filter-button'
              }
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
            >
              {status === 'ALL'
                ? 'All'
                : statusLabel(status)}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <section className="table-card">
        {loading ? (
          <div className="empty-state">
            Loading reconciliation records...
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <strong>No reconciliation records found</strong>

            <span>
              Payments requiring reconciliation will appear here.
            </span>
          </div>
        ) : (
          <>
            <div className="desktop-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Amount</th>
                    <th>UTR</th>
                    <th>Payment Date</th>
                    <th>Payment Status</th>
                    <th>Reconciliation</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => {
                    const reconciliationStatus =
                      getReconciliationStatus(item);

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="primary-text">
                            {item.student?.name ??
                              item.studentId}
                          </div>

                          {item.student
                            ?.admissionNumber && (
                            <div className="secondary-text">
                              {
                                item.student
                                  .admissionNumber
                              }
                            </div>
                          )}
                        </td>

                        <td className="amount">
                          {formatCurrency(
                            item.amount,
                            item.currency ?? 'INR',
                          )}
                        </td>

                        <td>
                          <div className="primary-text">
                            {item.utr ?? '—'}
                          </div>

                          {item.transactionReferenceId && (
                            <div className="secondary-text">
                              {
                                item
                                  .transactionReferenceId
                              }
                            </div>
                          )}
                        </td>

                        <td>
                          {formatDate(
                            item.verifiedAt ??
                              item.submittedAt ??
                              item.initiatedAt,
                          )}
                        </td>

                        <td>
                          <span
                            className={`status ${statusClass(
                              item.status,
                            )}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status reconciliation-status ${statusClass(
                              reconciliationStatus,
                            )}`}
                          >
                            {statusLabel(
                              reconciliationStatus,
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              openDetails(item)
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
              {items.map((item) => {
                const reconciliationStatus =
                  getReconciliationStatus(item);

                return (
                  <article
                    className="reconciliation-card"
                    key={item.id}
                  >
                    <div className="card-header">
                      <div>
                        <h3>
                          {item.student?.name ??
                            item.studentId}
                        </h3>

                        {item.student
                          ?.admissionNumber && (
                          <p>
                            {
                              item.student
                                .admissionNumber
                            }
                          </p>
                        )}
                      </div>

                      <span
                        className={`status ${statusClass(
                          reconciliationStatus,
                        )}`}
                      >
                        {statusLabel(
                          reconciliationStatus,
                        )}
                      </span>
                    </div>

                    <div className="card-details">
                      <div>
                        <span>Amount</span>
                        <strong>
                          {formatCurrency(
                            item.amount,
                            item.currency ?? 'INR',
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Payment Status</span>
                        <strong>
                          {statusLabel(item.status)}
                        </strong>
                      </div>

                      <div>
                        <span>UTR</span>
                        <strong>
                          {item.utr ?? '—'}
                        </strong>
                      </div>

                      <div>
                        <span>Date</span>
                        <strong>
                          {formatDate(
                            item.verifiedAt ??
                              item.submittedAt ??
                              item.initiatedAt,
                          )}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="secondary-button full-button"
                      onClick={() =>
                        openDetails(item)
                      }
                    >
                      View Details
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

      {selectedItem && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reconciliation-detail-title"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  Payment Reconciliation
                </div>

                <h2 id="reconciliation-detail-title">
                  Payment Details
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeDetails}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <section className="detail-section">
                <h3>Student</h3>

                <div className="detail-grid">
                  <div>
                    <span>Name</span>
                    <strong>
                      {selectedItem.student?.name ??
                        selectedItem.studentId}
                    </strong>
                  </div>

                  <div>
                    <span>Admission Number</span>
                    <strong>
                      {selectedItem.student
                        ?.admissionNumber ?? '—'}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h3>Payment</h3>

                <div className="detail-grid">
                  <div>
                    <span>Amount</span>
                    <strong>
                      {formatCurrency(
                        selectedItem.amount,
                        selectedItem.currency ?? 'INR',
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Method</span>
                    <strong>
                      {selectedItem.method
                        ? statusLabel(
                            selectedItem.method,
                          )
                        : '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>
                      {statusLabel(
                        selectedItem.status,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Reconciliation</span>
                    <strong>
                      {statusLabel(
                        getReconciliationStatus(
                          selectedItem,
                        ),
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>UTR</span>
                    <strong>
                      {selectedItem.utr ?? '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Transaction Reference</span>
                    <strong>
                      {
                        selectedItem.transactionReferenceId ??
                        '—'
                      }
                    </strong>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h3>Timeline</h3>

                <div className="timeline">
                  <div>
                    <span>Initiated</span>
                    <strong>
                      {formatDateTime(
                        selectedItem.initiatedAt,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Submitted</span>
                    <strong>
                      {formatDateTime(
                        selectedItem.submittedAt,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Verified</span>
                    <strong>
                      {formatDateTime(
                        selectedItem.verifiedAt,
                      )}
                    </strong>
                  </div>

                  {selectedItem.reconciledAt && (
                    <div>
                      <span>Reconciled</span>
                      <strong>
                        {formatDateTime(
                          selectedItem.reconciledAt,
                        )}
                      </strong>
                    </div>
                  )}
                </div>
              </section>

              {selectedItem.rejectedReason && (
                <section className="detail-section">
                  <h3>Rejection Reason</h3>

                  <p className="rejection-reason">
                    {selectedItem.rejectedReason}
                  </p>
                </section>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .reconciliation-page {
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

        .summary-cards {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .summary-card {
          min-width: 82px;
          padding: 10px 13px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 9px;
          background: var(--bg, #ffffff);
        }

        .summary-card span {
          display: block;
          color: var(--muted, #6b7280);
          font-size: 10px;
        }

        .summary-card strong {
          display: block;
          margin-top: 3px;
          color: var(--foreground, #111827);
          font-size: 18px;
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
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          margin-bottom: 16px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
          background: var(--bg, #ffffff);
          flex-wrap: wrap;
        }

        .search-form {
          display: flex;
          flex: 1;
          min-width: 280px;
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

        .filter-group {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .filter-button {
          min-height: 34px;
          padding: 0 9px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: var(--muted, #6b7280);
          font-size: 11px;
          font-weight: 600;
        }

        .filter-button.active {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .error-message {
          margin-bottom: 16px;
          padding: 12px 14px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
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
          min-width: 1000px;
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
          font-size: 11px;
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
          font-size: 10px;
          font-weight: 600;
        }

        .status.paid,
        .status.reconciled {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .status.submitted,
        .status.verifying,
        .status.pending {
          background: var(--border, #f3f4f6);
          color: var(--foreground, #374151);
        }

        .status.rejected {
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

        .reconciliation-card {
          padding: 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .reconciliation-card:last-child {
          border-bottom: 0;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .reconciliation-card h3 {
          margin: 0;
          color: var(--foreground, #111827);
          font-size: 15px;
        }

        .reconciliation-card p {
          margin: 4px 0 0;
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .card-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .card-details div {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 4px;
        }

        .card-details span {
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .card-details strong {
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

        .detail-section:last-child {
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

        .detail-grid div,
        .timeline div {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 4px;
        }

        .detail-grid span,
        .timeline span {
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .detail-grid strong,
        .timeline strong {
          overflow-wrap: anywhere;
          color: var(--foreground, #111827);
          font-size: 13px;
        }

        .timeline {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .rejection-reason {
          margin: 0;
          color: #b91c1c;
          font-size: 13px;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          padding: 16px 20px;
          border-top: 1px solid var(--border, #e5e7eb);
        }

        @media (max-width: 800px) {
          .toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .search-form {
            width: 100%;
            min-width: 0;
          }

          .filter-group {
            width: 100%;
          }
        }

        @media (max-width: 700px) {
          .desktop-table-wrapper {
            display: none;
          }

          .mobile-list {
            display: block;
          }

          .summary-cards {
            width: 100%;
          }

          .summary-card {
            flex: 1;
          }

          .detail-grid,
          .timeline {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .page-header {
            flex-direction: column;
          }

          .search-form {
            flex-direction: column;
          }

          .search-form .primary-button {
            width: 100%;
          }

          .filter-button {
            flex: 1;
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

          .pagination {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}