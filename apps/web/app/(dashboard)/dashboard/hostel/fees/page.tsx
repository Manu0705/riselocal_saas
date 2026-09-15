'use client';

import { FormEvent, useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type Fee = {
  id: string;
  name: string;
  description?: string | null;
  amount: number;
  currency?: string;
  frequency?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type HostelProperty = {
  id: string;
  name: string;
  status: string;
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

type FeeListResponse = {
  items: Fee[];
  pagination: Pagination;
};

type FeeForm = {
  name: string;
  description: string;
  amount: string;
  frequency: string;
  hostelId: string;
};

const DEFAULT_FORM: FeeForm = {
  name: '',
  description: '',
  amount: '',
  frequency: 'MONTHLY',
  hostelId: '',
};

const PAGE_LIMIT = 10;

function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function normalizeAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export default function HostelFeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [properties, setProperties] = useState<HostelProperty[]>([]);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'active' | 'inactive'
  >('active');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [form, setForm] = useState<FeeForm>(DEFAULT_FORM);

  async function loadProperties() {
    try {
      const response = await api.get<ApiResponse<HostelProperty[]>>(
        '/hostel/properties',
      );

      setProperties(response.data ?? []);
    } catch {
      setProperties([]);
    }
  }

  async function loadFees() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (activeFilter === 'active') {
        params.set('isActive', 'true');
      }

      if (activeFilter === 'inactive') {
        params.set('isActive', 'false');
      }

      if (form.hostelId) {
        params.set('hostelId', form.hostelId);
      }

      const response = await api.get<ApiResponse<FeeListResponse>>(
        `/hostel/fees?${params.toString()}`,
      );

      setFees(response.data?.items ?? []);
      setPagination(response.data?.pagination ?? null);
    } catch (err) {
      setFees([]);
      setPagination(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load hostel fees.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProperties();
  }, []);

  useEffect(() => {
    void loadFees();
    // Search/filter/page changes intentionally reload the fee list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeFilter]);

  function openCreateModal() {
    setEditingFeeId(null);

    setForm({
      ...DEFAULT_FORM,
      hostelId: properties[0]?.id ?? '',
    });

    setError('');
    setShowModal(true);
  }

  function openEditModal(fee: Fee) {
    setEditingFeeId(fee.id);

    setForm({
      name: fee.name ?? '',
      description: fee.description ?? '',
      amount: String(fee.amount ?? ''),
      frequency: fee.frequency ?? 'MONTHLY',
      hostelId: properties[0]?.id ?? '',
    });

    setError('');
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingFeeId(null);
    setForm(DEFAULT_FORM);
  }

  function updateForm<K extends keyof FeeForm>(
    field: K,
    value: FeeForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Fee name is required.');
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid fee amount.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        amount,
        frequency: form.frequency,
        hostelId: form.hostelId || undefined,
      };

      if (editingFeeId) {
        await api.patch(
          `/hostel/fees/${encodeURIComponent(editingFeeId)}`,
          payload,
        );
      } else {
        await api.post('/hostel/fees', payload);
      }

      closeModal();
      await loadFees();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save the fee.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(fee: Fee) {
    const confirmed = window.confirm(
      `Deactivate "${fee.name}"?`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await api.post(
        `/hostel/fees/${encodeURIComponent(fee.id)}/deactivate`,
        {},
      );

      await loadFees();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to deactivate the fee.',
      );
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);
    void loadFees();
  }

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="fees-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">Hostel Finance</div>

          <h1>Fees &amp; Billing</h1>

          <p>
            Manage hostel fee structures and recurring student charges.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateModal}
        >
          + Add Fee
        </button>
      </header>

      <section className="filters-card">
        <form
          className="search-form"
          onSubmit={handleSearchSubmit}
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search fees..."
            aria-label="Search fees"
          />

          <button type="submit" className="secondary-button">
            Search
          </button>
        </form>

        <div className="filter-group">
          <button
            type="button"
            className={
              activeFilter === 'active'
                ? 'filter-button active'
                : 'filter-button'
            }
            onClick={() => {
              setActiveFilter('active');
              setPage(1);
            }}
          >
            Active
          </button>

          <button
            type="button"
            className={
              activeFilter === 'inactive'
                ? 'filter-button active'
                : 'filter-button'
            }
            onClick={() => {
              setActiveFilter('inactive');
              setPage(1);
            }}
          >
            Inactive
          </button>

          <button
            type="button"
            className={
              activeFilter === 'all'
                ? 'filter-button active'
                : 'filter-button'
            }
            onClick={() => {
              setActiveFilter('all');
              setPage(1);
            }}
          >
            All
          </button>
        </div>
      </section>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Fee Structures</h2>

            <p>
              {pagination
                ? `${pagination.total} fee${pagination.total === 1 ? '' : 's'}`
                : 'Fee list'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading fees...
          </div>
        ) : fees.length === 0 ? (
          <div className="empty-state">
            <strong>No fees found</strong>
            <span>
              Create your first hostel fee structure to get started.
            </span>
          </div>
        ) : (
          <>
            <div className="desktop-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Fee</th>
                    <th>Frequency</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {fees.map((fee) => {
                    const amount = normalizeAmount(fee.amount);
                    const isActive = fee.isActive !== false;

                    return (
                      <tr key={fee.id}>
                        <td>
                          <div className="fee-name">
                            {fee.name}
                          </div>

                          {fee.description && (
                            <div className="fee-description">
                              {fee.description}
                            </div>
                          )}
                        </td>

                        <td>
                          {fee.frequency ?? '—'}
                        </td>

                        <td className="amount">
                          {formatCurrency(
                            amount,
                            fee.currency ?? 'INR',
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              isActive
                                ? 'status active'
                                : 'status inactive'
                            }
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td>
                          <div className="actions">
                            <button
                              type="button"
                              className="text-button"
                              onClick={() => openEditModal(fee)}
                            >
                              Edit
                            </button>

                            {isActive && (
                              <button
                                type="button"
                                className="danger-button"
                                onClick={() =>
                                  void handleDeactivate(fee)
                                }
                              >
                                Deactivate
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
              {fees.map((fee) => {
                const amount = normalizeAmount(fee.amount);
                const isActive = fee.isActive !== false;

                return (
                  <article
                    key={fee.id}
                    className="fee-card"
                  >
                    <div className="fee-card-top">
                      <div>
                        <h3>{fee.name}</h3>

                        {fee.description && (
                          <p>{fee.description}</p>
                        )}
                      </div>

                      <span
                        className={
                          isActive
                            ? 'status active'
                            : 'status inactive'
                        }
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="fee-card-details">
                      <div>
                        <span>Amount</span>
                        <strong>
                          {formatCurrency(
                            amount,
                            fee.currency ?? 'INR',
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Frequency</span>
                        <strong>
                          {fee.frequency ?? '—'}
                        </strong>
                      </div>
                    </div>

                    <div className="mobile-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => openEditModal(fee)}
                      >
                        Edit
                      </button>

                      {isActive && (
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            void handleDeactivate(fee)
                          }
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {!loading && pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="secondary-button"
              disabled={page <= 1}
              onClick={() =>
                setPage((current) => Math.max(1, current - 1))
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
                  Math.min(totalPages, current + 1),
                )
              }
            >
              Next
            </button>
          </div>
        )}
      </section>

      {showModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fee-modal-title"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  {editingFeeId ? 'Update' : 'Create'}
                </div>

                <h2 id="fee-modal-title">
                  {editingFeeId
                    ? 'Edit Fee'
                    : 'Add Fee'}
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  <span>Fee name *</span>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateForm('name', event.target.value)
                    }
                    placeholder="e.g. Monthly Hostel Fee"
                    required
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
                      updateForm('amount', event.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </label>

                <label>
                  <span>Frequency</span>

                  <select
                    value={form.frequency}
                    onChange={(event) =>
                      updateForm(
                        'frequency',
                        event.target.value,
                      )
                    }
                  >
                    <option value="MONTHLY">
                      Monthly
                    </option>
                    <option value="QUARTERLY">
                      Quarterly
                    </option>
                    <option value="HALF_YEARLY">
                      Half Yearly
                    </option>
                    <option value="YEARLY">
                      Yearly
                    </option>
                    <option value="ONE_TIME">
                      One Time
                    </option>
                  </select>
                </label>

                <label>
                  <span>Hostel</span>

                  <select
                    value={form.hostelId}
                    onChange={(event) =>
                      updateForm(
                        'hostelId',
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Select hostel
                    </option>

                    {properties.map((property) => (
                      <option
                        key={property.id}
                        value={property.id}
                      >
                        {property.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="full-width">
                  <span>Description</span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        'description',
                        event.target.value,
                      )
                    }
                    placeholder="Optional fee description"
                    rows={3}
                  />
                </label>
              </div>

              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
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
                    : editingFeeId
                      ? 'Update Fee'
                      : 'Create Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .fees-page {
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

        .primary-button,
        .secondary-button,
        .filter-button,
        .text-button,
        .danger-button,
        .close-button {
          border: 0;
          font: inherit;
          cursor: pointer;
        }

        .primary-button {
          min-height: 40px;
          padding: 0 15px;
          border-radius: 8px;
          background: var(--primary, #2563eb);
          color: var(--primary-foreground, #ffffff);
          font-size: 13px;
          font-weight: 600;
        }

        .primary-button:disabled,
        .secondary-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .filters-card,
        .table-card {
          background: var(--bg, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
        }

        .filters-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .search-form {
          display: flex;
          gap: 8px;
          flex: 1;
          min-width: 240px;
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
          padding: 0 12px;
        }

        textarea {
          padding: 10px 12px;
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: var(--primary, #2563eb);
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

        .filter-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-button {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 7px;
          background: transparent;
          color: var(--muted, #6b7280);
          font-size: 13px;
          font-weight: 600;
        }

        .filter-button.active {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .error-message,
        .form-error {
          margin-bottom: 16px;
          padding: 12px 14px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
          background: var(--bg, #ffffff);
          color: var(--foreground, #b91c1c);
          font-size: 13px;
        }

        .table-card {
          overflow: hidden;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .section-heading h2 {
          margin: 0;
          color: var(--foreground, #111827);
          font-size: 17px;
          font-weight: 650;
        }

        .section-heading p {
          margin: 5px 0 0;
          color: var(--muted, #6b7280);
          font-size: 12px;
        }

        .desktop-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }

        th,
        td {
          padding: 14px 20px;
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

        .fee-name {
          font-weight: 600;
          color: var(--foreground, #111827);
        }

        .fee-description {
          margin-top: 4px;
          max-width: 360px;
          color: var(--muted, #6b7280);
          font-size: 12px;
        }

        .amount {
          font-weight: 600;
        }

        .status {
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          padding: 0 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }

        .status.active {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .status.inactive {
          background: var(--border, #f3f4f6);
          color: var(--muted, #6b7280);
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          white-space: nowrap;
        }

        .text-button {
          background: transparent;
          color: var(--primary, #2563eb);
          font-size: 12px;
          font-weight: 600;
        }

        .danger-button {
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
          width: min(560px, 100%);
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
          font-weight: 700;
        }

        .close-button {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          background: transparent;
          color: var(--muted, #6b7280);
          font-size: 24px;
          line-height: 1;
        }

        .modal form {
          padding: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        label span {
          color: var(--foreground, #374151);
          font-size: 12px;
          font-weight: 600;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .form-error {
          margin-top: 16px;
          margin-bottom: 0;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--border, #e5e7eb);
        }

        .mobile-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .fee-card {
          padding: 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .fee-card:last-child {
          border-bottom: 0;
        }

        .fee-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .fee-card h3 {
          margin: 0;
          color: var(--foreground, #111827);
          font-size: 15px;
          font-weight: 650;
        }

        .fee-card p {
          margin: 5px 0 0;
          color: var(--muted, #6b7280);
          font-size: 12px;
        }

        .fee-card-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .fee-card-details div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .fee-card-details span {
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .fee-card-details strong {
          color: var(--foreground, #111827);
          font-size: 13px;
        }

        @media (max-width: 700px) {
          .desktop-table-wrapper {
            display: none;
          }

          .mobile-list {
            display: block;
          }

          .form-grid {
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

          .filters-card {
            align-items: stretch;
            flex-direction: column;
          }

          .search-form {
            min-width: 0;
          }

          .filter-group {
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
            flex-direction: column-reverse;
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