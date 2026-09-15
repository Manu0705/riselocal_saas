'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api-client';

type DepositStatus =
  | 'PENDING'
  | 'DEPOSITED'
  | 'RECONCILED'
  | 'CANCELLED';

type Deposit = {
  id: string;
  tenantId?: string;
  hostelId?: string;
  amount?: number | string | null;
  currency?: string | null;
  depositDate?: string | null;
  referenceNumber?: string | null;
  paymentMethod?: string | null;
  status?: DepositStatus | string | null;
  depositedBy?: string | null;
  reconciledAt?: string | null;
  reconciledBy?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type DepositsResponse = {
  items: Deposit[];
  pagination: Pagination;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type DepositForm = {
  hostelId: string;
  amount: string;
  currency: string;
  depositDate: string;
  referenceNumber: string;
  paymentMethod: string;
  notes: string;
};

const PAGE_LIMIT = 10;

const STATUS_OPTIONS = [
  'ALL',
  'PENDING',
  'DEPOSITED',
  'RECONCILED',
  'CANCELLED',
];

const PAYMENT_METHODS = ['UPI'];

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

function formatLabel(value?: string | null) {
  if (!value) return '—';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status?: string | null) {
  return (status ?? 'unknown').toLowerCase();
}

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const EMPTY_FORM: DepositForm = {
  hostelId: '',
  amount: '',
  currency: 'INR',
  depositDate: getToday(),
  referenceNumber: '',
  paymentMethod: 'UPI',
  notes: '',
};

export default function HostelDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingDeposit, setEditingDeposit] =
    useState<Deposit | null>(null);

  const [selectedDeposit, setSelectedDeposit] =
    useState<Deposit | null>(null);

  const [form, setForm] =
    useState<DepositForm>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(
    null,
  );

  async function loadDeposits() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }

      if (fromDate) {
        params.set('from', fromDate);
      }

      if (toDate) {
        params.set('to', toDate);
      }

      const response = await api.get<
        ApiResponse<DepositsResponse>
      >(`/hostel/deposits?${params.toString()}`);

      setDeposits(response.data?.items ?? []);
      setPagination(response.data?.pagination ?? null);
    } catch (err) {
      setDeposits([]);
      setPagination(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load deposits.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDeposits();
  }, [page, statusFilter, fromDate, toDate]);

  const summary = useMemo(() => {
    let pending = 0;
    let deposited = 0;
    let reconciled = 0;
    let total = 0;

    deposits.forEach((deposit) => {
      const amount = Number(deposit.amount ?? 0);
      const status = deposit.status?.toUpperCase();

      if (status === 'PENDING') {
        pending += amount;
      }

      if (status === 'DEPOSITED') {
        deposited += amount;
      }

      if (status === 'RECONCILED') {
        reconciled += amount;
      }

      if (status !== 'CANCELLED') {
        total += amount;
      }
    });

    return {
      pending,
      deposited,
      reconciled,
      total,
    };
  }, [deposits]);

  function resetFilters() {
    setStatusFilter('ALL');
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  function openCreateForm() {
    setEditingDeposit(null);
    setForm({
      ...EMPTY_FORM,
      depositDate: getToday(),
    });
    setShowForm(true);
    setError('');
  }

  function openEditForm(deposit: Deposit) {
    setEditingDeposit(deposit);

    const depositDate = deposit.depositDate
      ? new Date(deposit.depositDate)
      : new Date();

    const year = depositDate.getFullYear();
    const month = String(
      depositDate.getMonth() + 1,
    ).padStart(2, '0');
    const day = String(depositDate.getDate()).padStart(
      2,
      '0',
    );

    setForm({
      hostelId: deposit.hostelId ?? '',
      amount: String(deposit.amount ?? ''),
      currency: deposit.currency ?? 'INR',
      depositDate: `${year}-${month}-${day}`,
      referenceNumber:
        deposit.referenceNumber ?? '',
      paymentMethod:
        deposit.paymentMethod ?? 'UPI',
      notes: deposit.notes ?? '',
    });

    setShowForm(true);
    setError('');
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingDeposit(null);
  }

  function updateForm(
    field: keyof DepositForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveDeposit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    if (!form.hostelId.trim()) {
      setError('Hostel ID is required.');
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Deposit amount must be greater than zero.');
      return;
    }

    if (!form.depositDate) {
      setError('Deposit date is required.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        hostelId: form.hostelId.trim(),
        amount,
        currency: form.currency.trim() || 'INR',
        depositDate: form.depositDate,
        referenceNumber:
          form.referenceNumber.trim() || undefined,
        paymentMethod: form.paymentMethod,
        notes: form.notes.trim() || undefined,
      };

      if (editingDeposit) {
        await api.patch(
          `/hostel/deposits/${encodeURIComponent(
            editingDeposit.id,
          )}`,
          payload,
        );
      } else {
        await api.post('/hostel/deposits', payload);
      }

      setShowForm(false);
      setEditingDeposit(null);

      await loadDeposits();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save deposit.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function reconcileDeposit(deposit: Deposit) {
    if (
      !window.confirm(
        'Are you sure you want to reconcile this deposit?',
      )
    ) {
      return;
    }

    setActionId(deposit.id);
    setError('');

    try {
      await api.post(
        `/hostel/deposits/${encodeURIComponent(
          deposit.id,
        )}/reconcile`,
        {},
      );

      await loadDeposits();

      if (selectedDeposit?.id === deposit.id) {
        setSelectedDeposit(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reconcile deposit.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function cancelDeposit(deposit: Deposit) {
    if (
      !window.confirm(
        'Are you sure you want to cancel this deposit?',
      )
    ) {
      return;
    }

    setActionId(deposit.id);
    setError('');

    try {
      await api.post(
        `/hostel/deposits/${encodeURIComponent(
          deposit.id,
        )}/cancel`,
        {},
      );

      await loadDeposits();

      if (selectedDeposit?.id === deposit.id) {
        setSelectedDeposit(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to cancel deposit.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function openDetails(deposit: Deposit) {
    setError('');

    try {
      const response = await api.get<
        ApiResponse<Deposit>
      >(
        `/hostel/deposits/${encodeURIComponent(
          deposit.id,
        )}`,
      );

      setSelectedDeposit(response.data ?? deposit);
    } catch (err) {
      setSelectedDeposit(deposit);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load deposit details.',
      );
    }
  }

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="deposits-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">Hostel Finance</div>

          <h1>Deposits</h1>

          <p>
            Track deposits, reconciliation status and
            financial references.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + New Deposit
        </button>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span>Total Active</span>
          <strong>
            {formatCurrency(summary.total)}
          </strong>
        </div>

        <div className="summary-card">
          <span>Pending</span>
          <strong>
            {formatCurrency(summary.pending)}
          </strong>
        </div>

        <div className="summary-card">
          <span>Deposited</span>
          <strong>
            {formatCurrency(summary.deposited)}
          </strong>
        </div>

        <div className="summary-card">
          <span>Reconciled</span>
          <strong>
            {formatCurrency(summary.reconciled)}
          </strong>
        </div>
      </section>

      <section className="filters-card">
        <div className="filter-row">
          <label>
            <span>Status</span>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL'
                    ? 'All Statuses'
                    : formatLabel(status)}
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
            className="secondary-button"
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
            Loading deposits...
          </div>
        ) : deposits.length === 0 ? (
          <div className="empty-state">
            <strong>No deposits found</strong>

            <span>
              Create a deposit to start tracking hostel
              financial deposits.
            </span>
          </div>
        ) : (
          <>
            <div className="desktop-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {deposits.map((deposit) => {
                    const status =
                      deposit.status?.toUpperCase();

                    const busy =
                      actionId === deposit.id;

                    return (
                      <tr key={deposit.id}>
                        <td>
                          {formatDate(
                            deposit.depositDate,
                          )}
                        </td>

                        <td className="amount">
                          {formatCurrency(
                            deposit.amount,
                            deposit.currency ?? 'INR',
                          )}
                        </td>

                        <td>
                          <div className="primary-text">
                            {formatLabel(
                              deposit.paymentMethod,
                            )}
                          </div>
                        </td>

                        <td>
                          {deposit.referenceNumber ??
                            '—'}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              status,
                            )}`}
                          >
                            {formatLabel(status)}
                          </span>
                        </td>

                        <td>
                          <div className="actions">
                            <button
                              type="button"
                              className="text-button"
                              onClick={() =>
                                void openDetails(
                                  deposit,
                                )
                              }
                            >
                              View
                            </button>

                            {status !==
                              'RECONCILED' &&
                              status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() =>
                                    openEditForm(
                                      deposit,
                                    )
                                  }
                                  disabled={busy}
                                >
                                  Edit
                                </button>
                              )}

                            {status !==
                              'RECONCILED' &&
                              status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() =>
                                    void reconcileDeposit(
                                      deposit,
                                    )
                                  }
                                  disabled={busy}
                                >
                                  {busy
                                    ? 'Working...'
                                    : 'Reconcile'}
                                </button>
                              )}

                            {status !==
                              'RECONCILED' &&
                              status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  className="danger-button"
                                  onClick={() =>
                                    void cancelDeposit(
                                      deposit,
                                    )
                                  }
                                  disabled={busy}
                                >
                                  Cancel
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-list">
              {deposits.map((deposit) => {
                const status =
                  deposit.status?.toUpperCase();

                const busy =
                  actionId === deposit.id;

                return (
                  <article
                    className="deposit-card"
                    key={deposit.id}
                  >
                    <div className="card-top">
                      <div>
                        <div className="card-date">
                          {formatDate(
                            deposit.depositDate,
                          )}
                        </div>

                        <h3>
                          {formatCurrency(
                            deposit.amount,
                            deposit.currency ?? 'INR',
                          )}
                        </h3>
                      </div>

                      <span
                        className={`status-badge ${getStatusClass(
                          status,
                        )}`}
                      >
                        {formatLabel(status)}
                      </span>
                    </div>

                    <div className="card-details">
                      <div>
                        <span>Payment Method</span>
                        <strong>
                          {formatLabel(
                            deposit.paymentMethod,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Reference</span>
                        <strong>
                          {deposit.referenceNumber ??
                            '—'}
                        </strong>
                      </div>

                      <div>
                        <span>Hostel</span>
                        <strong>
                          {deposit.hostelId ?? '—'}
                        </strong>
                      </div>

                      <div>
                        <span>Deposited By</span>
                        <strong>
                          {deposit.depositedBy ?? '—'}
                        </strong>
                      </div>
                    </div>

                    <div className="mobile-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          void openDetails(
                            deposit,
                          )
                        }
                      >
                        View
                      </button>

                      {status !== 'RECONCILED' &&
                        status !== 'CANCELLED' && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              openEditForm(deposit)
                            }
                            disabled={busy}
                          >
                            Edit
                          </button>
                        )}

                      {status !== 'RECONCILED' &&
                        status !== 'CANCELLED' && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              void reconcileDeposit(
                                deposit,
                              )
                            }
                            disabled={busy}
                          >
                            Reconcile
                          </button>
                        )}

                      {status !== 'RECONCILED' &&
                        status !== 'CANCELLED' && (
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              void cancelDeposit(
                                deposit,
                              )
                            }
                            disabled={busy}
                          >
                            Cancel
                          </button>
                        )}
                    </div>
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

      {showForm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <form
            className="modal"
            onSubmit={saveDeposit}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  Hostel Finance
                </div>

                <h2>
                  {editingDeposit
                    ? 'Edit Deposit'
                    : 'New Deposit'}
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="form-grid">
                <label>
                  <span>Hostel ID *</span>

                  <input
                    value={form.hostelId}
                    onChange={(event) =>
                      updateForm(
                        'hostelId',
                        event.target.value,
                      )
                    }
                    placeholder="Enter hostel ID"
                    disabled={Boolean(editingDeposit)}
                  />
                </label>

                <label>
                  <span>Amount *</span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      updateForm(
                        'amount',
                        event.target.value,
                      )
                    }
                    placeholder="0.00"
                    disabled={Boolean(editingDeposit)}
                  />
                </label>

                <label>
                  <span>Currency</span>

                  <input
                    value={form.currency}
                    onChange={(event) =>
                      updateForm(
                        'currency',
                        event.target.value,
                      )
                    }
                    disabled={Boolean(editingDeposit)}
                  />
                </label>

                <label>
                  <span>Deposit Date *</span>

                  <input
                    type="date"
                    value={form.depositDate}
                    onChange={(event) =>
                      updateForm(
                        'depositDate',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Payment Method</span>

                  <select
                    value={form.paymentMethod}
                    onChange={(event) =>
                      updateForm(
                        'paymentMethod',
                        event.target.value,
                      )
                    }
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option
                        key={method}
                        value={method}
                      >
                        {method}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Reference Number</span>

                  <input
                    value={form.referenceNumber}
                    onChange={(event) =>
                      updateForm(
                        'referenceNumber',
                        event.target.value,
                      )
                    }
                    placeholder="UTR / transaction reference"
                  />
                </label>

                <label className="full-width">
                  <span>Notes</span>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm(
                        'notes',
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="Optional notes"
                  />
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingDeposit
                    ? 'Save Changes'
                    : 'Create Deposit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedDeposit && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDeposit(null);
            }
          }}
        >
          <div
            className="modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deposit-details-title"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  Deposit Details
                </div>

                <h2 id="deposit-details-title">
                  Transaction
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setSelectedDeposit(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="detail-grid">
                <div>
                  <span>Amount</span>
                  <strong>
                    {formatCurrency(
                      selectedDeposit.amount,
                      selectedDeposit.currency ??
                        'INR',
                    )}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {formatLabel(
                      selectedDeposit.status,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Deposit Date</span>
                  <strong>
                    {formatDateTime(
                      selectedDeposit.depositDate,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Payment Method</span>
                  <strong>
                    {formatLabel(
                      selectedDeposit.paymentMethod,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Reference Number</span>
                  <strong>
                    {selectedDeposit.referenceNumber ??
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Hostel ID</span>
                  <strong>
                    {selectedDeposit.hostelId ?? '—'}
                  </strong>
                </div>

                <div>
                  <span>Deposited By</span>
                  <strong>
                    {selectedDeposit.depositedBy ?? '—'}
                  </strong>
                </div>

                <div>
                  <span>Created At</span>
                  <strong>
                    {formatDateTime(
                      selectedDeposit.createdAt,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Reconciled At</span>
                  <strong>
                    {formatDateTime(
                      selectedDeposit.reconciledAt,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Reconciled By</span>
                  <strong>
                    {selectedDeposit.reconciledBy ?? '—'}
                  </strong>
                </div>
              </div>

              <div className="notes-section">
                <span>Notes</span>

                <p>
                  {selectedDeposit.notes ??
                    'No notes provided.'}
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setSelectedDeposit(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .deposits-page {
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
        }

        .page-header p {
          margin: 8px 0 0;
          color: var(--muted, #6b7280);
          font-size: 14px;
        }

        h2 {
          margin: 4px 0 0;
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

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }

        .summary-card {
          padding: 14px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 10px;
          background: var(--bg, #ffffff);
        }

        .summary-card span {
          display: block;
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .summary-card strong {
          display: block;
          margin-top: 5px;
          color: var(--foreground, #111827);
          font-size: 17px;
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
            minmax(180px, 1fr)
            minmax(160px, 1fr)
            minmax(160px, 1fr)
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

        input,
        select,
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--border, #d1d5db);
          border-radius: 8px;
          background: var(--bg, #ffffff);
          color: var(--foreground, #111827);
          font: inherit;
          outline: none;
        }

        input,
        select {
          height: 40px;
          padding: 0 10px;
        }

        textarea {
          padding: 10px;
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: var(--primary, #2563eb);
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
          min-width: 950px;
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

        .amount {
          color: var(--foreground, #111827);
          font-weight: 600;
          white-space: nowrap;
        }

        .primary-text {
          color: var(--foreground, #111827);
          font-weight: 600;
        }

        .status-badge {
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

        .status-badge.pending {
          background: #fff7ed;
          color: #c2410c;
        }

        .status-badge.deposited {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .status-badge.reconciled {
          background: #f0fdf4;
          color: #15803d;
        }

        .status-badge.cancelled {
          background: #fef2f2;
          color: #b91c1c;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .text-button {
          padding: 0;
          border: 0;
          background: transparent;
          color: var(--primary, #2563eb);
          font-size: 12px;
          font-weight: 600;
        }

        .danger-button {
          padding: 0;
          border: 0;
          background: transparent;
          color: #b91c1c;
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

        .deposit-card {
          padding: 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .deposit-card:last-child {
          border-bottom: 0;
        }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .card-date {
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .deposit-card h3 {
          margin: 4px 0 0;
          color: var(--foreground, #111827);
          font-size: 18px;
        }

        .card-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .card-details div,
        .detail-grid div {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 4px;
        }

        .card-details span,
        .detail-grid span,
        .notes-section > span {
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .card-details strong,
        .detail-grid strong {
          overflow-wrap: anywhere;
          color: var(--foreground, #111827);
          font-size: 13px;
        }

        .mobile-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 16px;
        }

        .mobile-actions .danger-button {
          min-height: 40px;
          border: 1px solid #fecaca;
          border-radius: 8px;
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

        .detail-modal {
          width: min(600px, 100%);
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px;
          border-bottom: 1px solid var(--border, #e5e7eb);
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

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .notes-section {
          padding-top: 18px;
          margin-top: 18px;
          border-top: 1px solid var(--border, #e5e7eb);
        }

        .notes-section p {
          margin: 7px 0 0;
          color: var(--foreground, #374151);
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid var(--border, #e5e7eb);
        }

        @media (max-width: 900px) {
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filter-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .desktop-table-wrapper {
            display: none;
          }

          .mobile-list {
            display: block;
          }

          .form-grid,
          .detail-grid {
            grid-template-columns: 1fr;
          }

          .full-width {
            grid-column: auto;
          }
        }

        @media (max-width: 520px) {
          .page-header {
            flex-direction: column;
          }

          .page-header .primary-button {
            width: 100%;
          }

          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filter-row {
            grid-template-columns: 1fr;
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
            flex-direction: column-reverse;
          }

          .modal-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}