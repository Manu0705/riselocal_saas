'use client';

import { FormEvent, useEffect, useState } from 'react';

import { api } from '@/lib/api-client';

type FeeAssignment = {
  id: string;
  studentId: string;
  feeId: string;
  amount: number;
  dueDate?: string | null;
  status?: string | null;
  notes?: string | null;
  student?: {
    id: string;
    name: string;
    admissionNumber?: string | null;
  } | null;
  fee?: {
    id: string;
    name: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

type Student = {
  id: string;
  name: string;
  admissionNumber?: string | null;
};

type Fee = {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  frequency?: string | null;
  isActive?: boolean;
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

type AssignmentListResponse = {
  items: FeeAssignment[];
  pagination: Pagination;
};

type StudentListResponse = {
  items: Student[];
  pagination?: Pagination;
};

type FeeListResponse = {
  items: Fee[];
  pagination?: Pagination;
};

type AssignmentForm = {
  studentId: string;
  feeId: string;
  amount: string;
  dueDate: string;
  notes: string;
};

const DEFAULT_FORM: AssignmentForm = {
  studentId: '',
  feeId: '',
  amount: '',
  dueDate: '',
  notes: '',
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

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN');
}

function statusLabel(status?: string | null) {
  if (!status) return '—';

  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function FeeAssignmentsPage() {
  const [assignments, setAssignments] = useState<FeeAssignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [statusFilter, setStatusFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] =
    useState<string | null>(null);

  const [form, setForm] = useState<AssignmentForm>(
    DEFAULT_FORM,
  );

  async function loadOptions() {
    setLoadingOptions(true);

    try {
      const [studentsResult, feesResult] =
        await Promise.allSettled([
          api.get<ApiResponse<StudentListResponse>>(
            '/hostel/students?page=1&limit=100',
          ),
          api.get<ApiResponse<FeeListResponse>>(
            '/hostel/fees?isActive=true&page=1&limit=100',
          ),
        ]);

      if (studentsResult.status === 'fulfilled') {
        setStudents(studentsResult.value.data?.items ?? []);
      } else {
        setStudents([]);
      }

      if (feesResult.status === 'fulfilled') {
        setFees(feesResult.value.data?.items ?? []);
      } else {
        setFees([]);
      }
    } finally {
      setLoadingOptions(false);
    }
  }

  async function loadAssignments() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }

      const response = await api.get<
        ApiResponse<AssignmentListResponse>
      >(`/hostel/fee-assignments?${params.toString()}`);

      setAssignments(response.data?.items ?? []);
      setPagination(response.data?.pagination ?? null);
    } catch (err) {
      setAssignments([]);
      setPagination(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load fee assignments.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOptions();
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [page, statusFilter]);

  function updateForm<K extends keyof AssignmentForm>(
    field: K,
    value: AssignmentForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setEditingAssignmentId(null);
    setForm(DEFAULT_FORM);
    setError('');
    setShowModal(true);
  }

  function openEditModal(assignment: FeeAssignment) {
    setEditingAssignmentId(assignment.id);

    setForm({
      studentId: assignment.studentId,
      feeId: assignment.feeId,
      amount: String(assignment.amount ?? ''),
      dueDate: assignment.dueDate
        ? assignment.dueDate.slice(0, 10)
        : '',
      notes: assignment.notes ?? '',
    });

    setError('');
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingAssignmentId(null);
    setForm(DEFAULT_FORM);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.studentId) {
      setError('Please select a student.');
      return;
    }

    if (!form.feeId) {
      setError('Please select a fee.');
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid assignment amount.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        studentId: form.studentId,
        feeId: form.feeId,
        amount,
        dueDate: form.dueDate || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (editingAssignmentId) {
        await api.patch(
          `/hostel/fee-assignments/${encodeURIComponent(
            editingAssignmentId,
          )}`,
          payload,
        );
      } else {
        await api.post(
          '/hostel/fee-assignments',
          payload,
        );
      }

      closeModal();
      await loadAssignments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save the fee assignment.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(
    assignment: FeeAssignment,
  ) {
    const studentName =
      assignment.student?.name ?? 'this student';

    const confirmed = window.confirm(
      `Cancel the fee assignment for ${studentName}?`,
    );

    if (!confirmed) return;

    setError('');

    try {
      await api.post(
        `/hostel/fee-assignments/${encodeURIComponent(
          assignment.id,
        )}/cancel`,
        {},
      );

      await loadAssignments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to cancel the fee assignment.',
      );
    }
  }

  function handleFeeChange(feeId: string) {
    updateForm('feeId', feeId);

    const selectedFee = fees.find(
      (fee) => fee.id === feeId,
    );

    if (
      selectedFee &&
      (!form.amount || Number(form.amount) === 0)
    ) {
      updateForm(
        'amount',
        String(normalizeAmount(selectedFee.amount)),
      );
    }
  }

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="assignments-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">Hostel Finance</div>

          <h1>Fee Assignments</h1>

          <p>
            Assign configured fees to individual hostel students.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateModal}
          disabled={loadingOptions}
        >
          + Assign Fee
        </button>
      </header>

      <section className="toolbar">
        <div className="toolbar-info">
          <strong>Assignments</strong>

          <span>
            {pagination
              ? `${pagination.total} assignment${
                  pagination.total === 1 ? '' : 's'
                }`
              : 'Fee assignments'}
          </span>
        </div>

        <div className="filter-group">
          {['ALL', 'PENDING', 'PAID', 'PARTIAL', 'CANCELLED'].map(
            (status) => (
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
            ),
          )}
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
            Loading fee assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <strong>No fee assignments found</strong>

            <span>
              Assign a configured fee to a student to get started.
            </span>
          </div>
        ) : (
          <>
            <div className="desktop-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Fee</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>

                <tbody>
                  {assignments.map((assignment) => {
                    const status =
                      assignment.status?.toUpperCase() ?? '';

                    const isCancelled =
                      status === 'CANCELLED';

                    return (
                      <tr key={assignment.id}>
                        <td>
                          <div className="primary-text">
                            {assignment.student?.name ??
                              assignment.studentId}
                          </div>

                          {assignment.student
                            ?.admissionNumber && (
                            <div className="secondary-text">
                              {
                                assignment.student
                                  .admissionNumber
                              }
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="primary-text">
                            {assignment.fee?.name ??
                              assignment.feeId}
                          </div>
                        </td>

                        <td className="amount">
                          {formatCurrency(
                            normalizeAmount(
                              assignment.amount,
                            ),
                          )}
                        </td>

                        <td>
                          {formatDate(
                            assignment.dueDate,
                          )}
                        </td>

                        <td>
                          <span
                            className={`status ${status.toLowerCase()}`}
                          >
                            {statusLabel(
                              assignment.status,
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="actions">
                            <button
                              type="button"
                              className="text-button"
                              onClick={() =>
                                openEditModal(assignment)
                              }
                              disabled={isCancelled}
                            >
                              Edit
                            </button>

                            {!isCancelled && (
                              <button
                                type="button"
                                className="danger-button"
                                onClick={() =>
                                  void handleCancel(
                                    assignment,
                                  )
                                }
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
              {assignments.map((assignment) => {
                const status =
                  assignment.status?.toUpperCase() ?? '';

                const isCancelled =
                  status === 'CANCELLED';

                return (
                  <article
                    key={assignment.id}
                    className="assignment-card"
                  >
                    <div className="assignment-card-header">
                      <div>
                        <h3>
                          {assignment.student?.name ??
                            assignment.studentId}
                        </h3>

                        {assignment.student
                          ?.admissionNumber && (
                          <p>
                            {
                              assignment.student
                                .admissionNumber
                            }
                          </p>
                        )}
                      </div>

                      <span
                        className={`status ${status.toLowerCase()}`}
                      >
                        {statusLabel(
                          assignment.status,
                        )}
                      </span>
                    </div>

                    <div className="assignment-details">
                      <div>
                        <span>Fee</span>
                        <strong>
                          {assignment.fee?.name ??
                            assignment.feeId}
                        </strong>
                      </div>

                      <div>
                        <span>Amount</span>
                        <strong>
                          {formatCurrency(
                            normalizeAmount(
                              assignment.amount,
                            ),
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Due Date</span>
                        <strong>
                          {formatDate(
                            assignment.dueDate,
                          )}
                        </strong>
                      </div>
                    </div>

                    {!isCancelled && (
                      <div className="mobile-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            openEditModal(assignment)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            void handleCancel(
                              assignment,
                            )
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    )}
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
            aria-labelledby="assignment-modal-title"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  {editingAssignmentId
                    ? 'Update'
                    : 'Create'}
                </div>

                <h2 id="assignment-modal-title">
                  {editingAssignmentId
                    ? 'Edit Fee Assignment'
                    : 'Assign Fee'}
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
                  <span>Student *</span>

                  <select
                    value={form.studentId}
                    onChange={(event) =>
                      updateForm(
                        'studentId',
                        event.target.value,
                      )
                    }
                    required
                  >
                    <option value="">
                      Select student
                    </option>

                    {students.map((student) => (
                      <option
                        key={student.id}
                        value={student.id}
                      >
                        {student.name}
                        {student.admissionNumber
                          ? ` — ${student.admissionNumber}`
                          : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Fee *</span>

                  <select
                    value={form.feeId}
                    onChange={(event) =>
                      handleFeeChange(
                        event.target.value,
                      )
                    }
                    required
                  >
                    <option value="">
                      Select fee
                    </option>

                    {fees.map((fee) => (
                      <option
                        key={fee.id}
                        value={fee.id}
                      >
                        {fee.name} —{' '}
                        {formatCurrency(
                          normalizeAmount(
                            fee.amount,
                          ),
                          fee.currency ?? 'INR',
                        )}
                      </option>
                    ))}
                  </select>
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
                    required
                  />
                </label>

                <label>
                  <span>Due Date</span>

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      updateForm(
                        'dueDate',
                        event.target.value,
                      )
                    }
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
                    rows={3}
                    placeholder="Optional notes"
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
                    : editingAssignmentId
                      ? 'Update Assignment'
                      : 'Assign Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .assignments-page {
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

        .toolbar-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .toolbar-info strong {
          color: var(--foreground, #111827);
          font-size: 14px;
        }

        .toolbar-info span {
          color: var(--muted, #6b7280);
          font-size: 12px;
        }

        .filter-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-button {
          min-height: 36px;
          padding: 0 11px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: var(--muted, #6b7280);
          font-size: 12px;
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
          min-width: 850px;
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

        .status.pending {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .status.paid {
          background: var(--primary-soft, #eff6ff);
          color: var(--primary, #2563eb);
        }

        .status.partial {
          background: var(--border, #f3f4f6);
          color: var(--foreground, #374151);
        }

        .status.cancelled {
          background: var(--border, #f3f4f6);
          color: var(--muted, #6b7280);
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          white-space: nowrap;
        }

        .text-button,
        .danger-button {
          border: 0;
          background: transparent;
          font-size: 12px;
          font-weight: 600;
        }

        .text-button {
          color: var(--primary, #2563eb);
        }

        .danger-button {
          color: #b91c1c;
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
          border: 0;
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

        .assignment-card {
          padding: 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .assignment-card:last-child {
          border-bottom: 0;
        }

        .assignment-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .assignment-card h3 {
          margin: 0;
          color: var(--foreground, #111827);
          font-size: 15px;
          font-weight: 650;
        }

        .assignment-card p {
          margin: 4px 0 0;
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .assignment-details {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .assignment-details div {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .assignment-details span {
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .assignment-details strong {
          overflow: hidden;
          color: var(--foreground, #111827);
          font-size: 13px;
          text-overflow: ellipsis;
        }

        .mobile-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
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

          .toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .filter-group {
            width: 100%;
          }

          .filter-button {
            flex: 1;
          }

          .assignment-details {
            grid-template-columns: 1fr 1fr;
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