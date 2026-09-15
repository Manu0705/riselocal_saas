'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type LedgerEntry = {
  id: string;
  hostelId: string;
  entryDate?: string | null;
  type?: string | null;
  direction?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type LedgerResponse = {
  items: LedgerEntry[];
  pagination: Pagination;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const PAGE_LIMIT = 10;

const ENTRY_TYPES = [
  'ALL',
  'PAYMENT',
  'DEPOSIT',
  'REFUND',
  'ADJUSTMENT',
  'EXPENSE',
  'OTHER',
];

const DIRECTIONS = ['ALL', 'CREDIT', 'DEBIT'];

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

function label(value?: string | null) {
  if (!value) return '—';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value?: string | null) {
  return (value ?? 'unknown').toLowerCase();
}

export default function HostelLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] =
    useState('ALL');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedEntry, setSelectedEntry] =
    useState<LedgerEntry | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  async function loadEntries() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      if (typeFilter !== 'ALL') {
        params.set('type', typeFilter);
      }

      if (directionFilter !== 'ALL') {
        params.set('direction', directionFilter);
      }

      if (fromDate) {
        params.set('from', fromDate);
      }

      if (toDate) {
        params.set('to', toDate);
      }

      const response = await api.get<
        ApiResponse<LedgerResponse>
      >(`/hostel/ledger?${params.toString()}`);

      setEntries(response.data?.items ?? []);
      setPagination(response.data?.pagination ?? null);
    } catch (err) {
      setEntries([]);
      setPagination(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load ledger entries.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEntries();
  }, [
    page,
    typeFilter,
    directionFilter,
    fromDate,
    toDate,
  ]);

  function resetFilters() {
    setTypeFilter('ALL');
    setDirectionFilter('ALL');
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  async function openDetails(entry: LedgerEntry) {
    setLoadingDetails(true);
    setError('');

    try {
      const response = await api.get<
        ApiResponse<LedgerEntry>
      >(
        `/hostel/ledger/${encodeURIComponent(entry.id)}`,
      );

      setSelectedEntry(response.data ?? entry);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load ledger details.',
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeDetails() {
    if (loadingDetails) return;

    setSelectedEntry(null);
  }

  const totalPages = pagination?.totalPages ?? 1;

  const creditTotal = entries
    .filter(
      (entry) =>
        entry.direction?.toUpperCase() === 'CREDIT',
    )
    .reduce(
      (total, entry) =>
        total + Number(entry.amount ?? 0),
      0,
    );

  const debitTotal = entries
    .filter(
      (entry) =>
        entry.direction?.toUpperCase() === 'DEBIT',
    )
    .reduce(
      (total, entry) =>
        total + Number(entry.amount ?? 0),
      0,
    );

  return (
    <div className="ledger-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">Hostel Finance</div>

          <h1>Student Ledger</h1>

          <p>
            Track hostel financial transactions, credits and
            debits.
          </p>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <span>Entries</span>
            <strong>{pagination?.total ?? 0}</strong>
          </div>

          <div className="summary-card">
            <span>Credits</span>
            <strong>
              {formatCurrency(creditTotal)}
            </strong>
          </div>

          <div className="summary-card">
            <span>Debits</span>
            <strong>
              {formatCurrency(debitTotal)}
            </strong>
          </div>
        </div>
      </header>

      <section className="filters-card">
        <div className="filter-row">
          <label>
            <span>Entry Type</span>

            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setPage(1);
              }}
            >
              {ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'ALL' ? 'All Types' : label(type)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Direction</span>

            <select
              value={directionFilter}
              onChange={(event) => {
                setDirectionFilter(event.target.value);
                setPage(1);
              }}
            >
              {DIRECTIONS.map((direction) => (
                <option
                  key={direction}
                  value={direction}
                >
                  {direction === 'ALL'
                    ? 'All Directions'
                    : label(direction)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>From</span>

            <input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <label>
            <span>To</span>

            <input
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <button
            type="button"
            className="secondary-button reset-button"
            onClick={resetFilters}
          >
            Reset
          </button>
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
            Loading ledger entries...
          </div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <strong>No ledger entries found</strong>

            <span>
              Financial transactions will appear here as they are
              recorded.
            </span>
          </div>
        ) : (
          <>
            <div className="desktop-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Reference</th>
                    <th>Direction</th>
                    <th>Amount</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => {
                    const direction =
                      entry.direction?.toUpperCase();

                    return (
                      <tr key={entry.id}>
                        <td>
                          {formatDate(entry.entryDate)}
                        </td>

                        <td>
                          <span
                            className={`type-badge ${statusClass(
                              entry.type,
                            )}`}
                          >
                            {label(entry.type)}
                          </span>
                        </td>

                        <td>
                          <div className="primary-text">
                            {entry.description ?? '—'}
                          </div>
                        </td>

                        <td>
                          {entry.referenceId ? (
                            <>
                              <div className="primary-text">
                                {entry.referenceId}
                              </div>

                              {entry.referenceType && (
                                <div className="secondary-text">
                                  {label(
                                    entry.referenceType,
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td>
                          <span
                            className={`direction ${statusClass(
                              direction,
                            )}`}
                          >
                            {label(direction)}
                          </span>
                        </td>

                        <td className="amount">
                          {formatCurrency(
                            entry.amount,
                            entry.currency ?? 'INR',
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              void openDetails(entry)
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
              {entries.map((entry) => {
                const direction =
                  entry.direction?.toUpperCase();

                return (
                  <article
                    className="ledger-card"
                    key={entry.id}
                  >
                    <div className="card-header">
                      <div>
                        <h3>
                          {entry.description ??
                            'Ledger Entry'}
                        </h3>

                        <p>
                          {formatDate(entry.entryDate)}
                        </p>
                      </div>

                      <span
                        className={`direction ${statusClass(
                          direction,
                        )}`}
                      >
                        {label(direction)}
                      </span>
                    </div>

                    <div className="card-details">
                      <div>
                        <span>Type</span>
                        <strong>
                          {label(entry.type)}
                        </strong>
                      </div>

                      <div>
                        <span>Amount</span>
                        <strong>
                          {formatCurrency(
                            entry.amount,
                            entry.currency ?? 'INR',
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Reference</span>
                        <strong>
                          {entry.referenceId ?? '—'}
                        </strong>
                      </div>

                      <div>
                        <span>Reference Type</span>
                        <strong>
                          {label(entry.referenceType)}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="secondary-button full-button"
                      onClick={() =>
                        void openDetails(entry)
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

      {selectedEntry && (
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
            aria-labelledby="ledger-detail-title"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  Ledger Entry
                </div>

                <h2 id="ledger-detail-title">
                  Transaction Details
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeDetails}
                disabled={loadingDetails}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {loadingDetails ? (
                <div className="detail-loading">
                  Loading ledger details...
                </div>
              ) : (
                <>
                  <div className="detail-section">
                    <h3>Transaction</h3>

                    <div className="detail-grid">
                      <div>
                        <span>Entry Date</span>
                        <strong>
                          {formatDateTime(
                            selectedEntry.entryDate,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Type</span>
                        <strong>
                          {label(selectedEntry.type)}
                        </strong>
                      </div>

                      <div>
                        <span>Direction</span>
                        <strong>
                          {label(
                            selectedEntry.direction,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Amount</span>
                        <strong>
                          {formatCurrency(
                            selectedEntry.amount,
                            selectedEntry.currency ??
                              'INR',
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Description</h3>

                    <p className="description">
                      {selectedEntry.description ??
                        'No description provided.'}
                    </p>
                  </div>

                  <div className="detail-section">
                    <h3>Reference</h3>

                    <div className="detail-grid">
                      <div>
                        <span>Reference Type</span>
                        <strong>
                          {label(
                            selectedEntry.referenceType,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Reference ID</span>
                        <strong>
                          {
                            selectedEntry.referenceId ??
                            '—'
                          }
                        </strong>
                      </div>

                      <div>
                        <span>Created By</span>
                        <strong>
                          {selectedEntry.createdBy ??
                            '—'}
                        </strong>
                      </div>

                      <div>
                        <span>Created At</span>
                        <strong>
                          {formatDateTime(
                            selectedEntry.createdAt,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeDetails}
                disabled={loadingDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ledger-page {
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
          min-width: 90px;
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
          font-size: 16px;
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

        .filters-card {
          padding: 14px;
          margin-bottom: 16px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
          background: var(--bg, #ffffff);
        }

        .filter-row {
          display: grid;
          grid-template-columns:
            minmax(150px, 1fr)
            minmax(150px, 1fr)
            minmax(140px, 1fr)
            minmax(140px, 1fr)
            auto;
          align-items: end;
          gap: 10px;
        }

        label {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 6px;
        }

        label span {
          color: var(--foreground, #374151);
          font-size: 11px;
          font-weight: 600;
        }

        select,
        input {
          width: 100%;
          height: 40px;
          box-sizing: border-box;
          padding: 0 10px;
          border: 1px solid var(--border, #d1d5db);
          border-radius: 8px;
          background: var(--bg, #ffffff);
          color: var(--foreground, #111827);
          font: inherit;
          outline: none;
        }

        select:focus,
        input:focus {
          border-color: var(--primary, #2563eb);
        }

        .reset-button {
          white-space: nowrap;
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

        .type-badge,
        .direction {
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

        .direction.credit {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .direction.debit {
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

        .mobile-list {
          display: none;
        }

        .ledger-card {
          padding: 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .ledger-card:last-child {
          border-bottom: 0;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .ledger-card h3 {
          margin: 0;
          color: var(--foreground, #111827);
          font-size: 15px;
        }

        .ledger-card p {
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

        .description {
          margin: 0;
          color: var(--foreground, #374151);
          font-size: 13px;
          line-height: 1.6;
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

        @media (max-width: 900px) {
          .filter-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .reset-button {
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

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .page-header {
            flex-direction: column;
          }

          .filter-row {
            grid-template-columns: 1fr;
          }

          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
          }

          .summary-card {
            min-width: 0;
          }

          .summary-card strong {
            font-size: 13px;
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