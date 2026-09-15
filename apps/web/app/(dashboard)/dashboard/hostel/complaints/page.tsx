'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api-client';

type ComplaintPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT';

type ComplaintStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

type Student = {
  id: string;
  name?: string | null;
  admissionNumber?: string | null;
};

type Hostel = {
  id: string;
  name?: string | null;
};

type Complaint = {
  id: string;
  tenantId?: string;
  hostelId: string;
  studentId?: string | null;
  subject: string;
  description: string;
  priority?: ComplaintPriority | string | null;
  status?: ComplaintStatus | string | null;
  assignedTo?: string | null;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  hostel?: Hostel | null;
  student?: Student | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ComplaintsResponse = {
  items: Complaint[];
  pagination: Pagination;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type ComplaintForm = {
  hostelId: string;
  studentId: string;
  subject: string;
  description: string;
  priority: ComplaintPriority;
  assignedTo: string;
  status: ComplaintStatus;
  resolution: string;
};

const PAGE_LIMIT = 10;

const PRIORITIES = [
  'ALL',
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

const STATUSES = [
  'ALL',
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED',
];

const EMPTY_FORM: ComplaintForm = {
  hostelId: '',
  studentId: '',
  subject: '',
  description: '',
  priority: 'MEDIUM',
  assignedTo: '',
  status: 'OPEN',
  resolution: '',
};

function formatLabel(value?: string | null) {
  if (!value) return '—';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function badgeClass(value?: string | null) {
  return (value ?? 'unknown').toLowerCase();
}

export default function HostelComplaintsPage() {
  const [complaints, setComplaints] = useState<
    Complaint[]
  >([]);

  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [priority, setPriority] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingComplaint, setEditingComplaint] =
    useState<Complaint | null>(null);

  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [form, setForm] =
    useState<ComplaintForm>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  async function loadComplaints() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (priority !== 'ALL') {
        params.set('priority', priority);
      }

      if (status !== 'ALL') {
        params.set('status', status);
      }

      const response = await api.get<
        ApiResponse<ComplaintsResponse>
      >(
        `/hostel/complaints?${params.toString()}`,
      );

      setComplaints(response.data?.items ?? []);
      setPagination(response.data?.pagination ?? null);
    } catch (err) {
      setComplaints([]);
      setPagination(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load complaints.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadComplaints();
  }, [page, search, priority, status]);

  const summary = useMemo(() => {
    let open = 0;
    let urgent = 0;
    let inProgress = 0;
    let resolved = 0;

    complaints.forEach((complaint) => {
      const complaintStatus =
        complaint.status?.toUpperCase();

      const complaintPriority =
        complaint.priority?.toUpperCase();

      if (complaintStatus === 'OPEN') {
        open += 1;
      }

      if (complaintStatus === 'IN_PROGRESS') {
        inProgress += 1;
      }

      if (
        complaintStatus === 'RESOLVED' ||
        complaintStatus === 'CLOSED'
      ) {
        resolved += 1;
      }

      if (complaintPriority === 'URGENT') {
        urgent += 1;
      }
    });

    return {
      open,
      urgent,
      inProgress,
      resolved,
    };
  }, [complaints]);

  function applySearch(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSearch(searchInput.trim());
    setPage(1);
  }

  function resetFilters() {
    setSearch('');
    setSearchInput('');
    setPriority('ALL');
    setStatus('ALL');
    setPage(1);
  }

  function openCreateForm() {
    setEditingComplaint(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
    setError('');
  }

  function openEditForm(complaint: Complaint) {
    setEditingComplaint(complaint);

    setForm({
      hostelId: complaint.hostelId ?? '',
      studentId: complaint.studentId ?? '',
      subject: complaint.subject ?? '',
      description: complaint.description ?? '',
      priority:
        (complaint.priority?.toUpperCase() as ComplaintPriority) ??
        'MEDIUM',
      assignedTo: complaint.assignedTo ?? '',
      status:
        (complaint.status?.toUpperCase() as ComplaintStatus) ??
        'OPEN',
      resolution: complaint.resolution ?? '',
    });

    setShowForm(true);
    setError('');
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingComplaint(null);
  }

  function updateForm(
    field: keyof ComplaintForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveComplaint(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    if (!form.hostelId.trim()) {
      setError('Hostel ID is required.');
      return;
    }

    if (!form.subject.trim()) {
      setError('Subject is required.');
      return;
    }

    if (!form.description.trim()) {
      setError('Description is required.');
      return;
    }

    setSaving(true);

    try {
      if (editingComplaint) {
        await api.patch(
          `/hostel/complaints/${encodeURIComponent(
            editingComplaint.id,
          )}`,
          {
            subject: form.subject.trim(),
            description: form.description.trim(),
            priority: form.priority,
            status: form.status,
            assignedTo:
              form.assignedTo.trim() || null,
            resolution:
              form.resolution.trim() || null,
          },
        );
      } else {
        await api.post('/hostel/complaints', {
          hostelId: form.hostelId.trim(),
          studentId:
            form.studentId.trim() || undefined,
          subject: form.subject.trim(),
          description: form.description.trim(),
          priority: form.priority,
          assignedTo:
            form.assignedTo.trim() || undefined,
        });
      }

      setShowForm(false);
      setEditingComplaint(null);

      await loadComplaints();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save complaint.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function openDetails(complaint: Complaint) {
    setError('');

    try {
      const response = await api.get<
        ApiResponse<Complaint>
      >(
        `/hostel/complaints/${encodeURIComponent(
          complaint.id,
        )}`,
      );

      setSelectedComplaint(
        response.data ?? complaint,
      );
    } catch (err) {
      setSelectedComplaint(complaint);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load complaint details.',
      );
    }
  }

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="complaints-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">
            Hostel Operations
          </div>

          <h1>Complaints</h1>

          <p>
            Track student complaints, priorities,
            resolutions and follow-up status.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + New Complaint
        </button>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span>Open</span>
          <strong>{summary.open}</strong>
        </div>

        <div className="summary-card">
          <span>In Progress</span>
          <strong>{summary.inProgress}</strong>
        </div>

        <div className="summary-card">
          <span>Urgent</span>
          <strong>{summary.urgent}</strong>
        </div>

        <div className="summary-card">
          <span>Resolved</span>
          <strong>{summary.resolved}</strong>
        </div>
      </section>

      <section className="filters-card">
        <form
          className="filter-row"
          onSubmit={applySearch}
        >
          <label className="search-field">
            <span>Search</span>

            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search subject or description"
            />
          </label>

          <label>
            <span>Priority</span>

            <select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);
                setPage(1);
              }}
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value === 'ALL'
                    ? 'All Priorities'
                    : formatLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Status</span>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value === 'ALL'
                    ? 'All Statuses'
                    : formatLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="primary-button"
          >
            Search
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={resetFilters}
          >
            Reset
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
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <strong>No complaints found</strong>

            <span>
              Complaints matching your filters will appear
              here.
            </span>
          </div>
        ) : (
          <>
            <div className="desktop-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Complaint</th>
                    <th>Student</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {complaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td>
                        <div className="primary-text">
                          {complaint.subject}
                        </div>

                        <div className="secondary-text">
                          {complaint.description.length >
                          70
                            ? `${complaint.description.slice(
                                0,
                                70,
                              )}...`
                            : complaint.description}
                        </div>
                      </td>

                      <td>
                        <div className="primary-text">
                          {complaint.student?.name ??
                            'General Complaint'}
                        </div>

                        {complaint.student
                          ?.admissionNumber && (
                          <div className="secondary-text">
                            {
                              complaint.student
                                .admissionNumber
                            }
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          className={`priority-badge ${badgeClass(
                            complaint.priority,
                          )}`}
                        >
                          {formatLabel(
                            complaint.priority,
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${badgeClass(
                            complaint.status,
                          )}`}
                        >
                          {formatLabel(
                            complaint.status,
                          )}
                        </span>
                      </td>

                      <td>
                        {complaint.assignedTo ?? '—'}
                      </td>

                      <td>
                        {formatDate(
                          complaint.createdAt,
                        )}
                      </td>

                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              void openDetails(
                                complaint,
                              )
                            }
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              openEditForm(complaint)
                            }
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-list">
              {complaints.map((complaint) => (
                <article
                  className="complaint-card"
                  key={complaint.id}
                >
                  <div className="card-top">
                    <div>
                      <h3>
                        {complaint.subject}
                      </h3>

                      <p>
                        {formatDate(
                          complaint.createdAt,
                        )}
                      </p>
                    </div>

                    <span
                      className={`priority-badge ${badgeClass(
                        complaint.priority,
                      )}`}
                    >
                      {formatLabel(
                        complaint.priority,
                      )}
                    </span>
                  </div>

                  <p className="card-description">
                    {complaint.description}
                  </p>

                  <div className="card-details">
                    <div>
                      <span>Student</span>
                      <strong>
                        {complaint.student?.name ??
                          'General Complaint'}
                      </strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong>
                        {formatLabel(
                          complaint.status,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Assigned To</span>
                      <strong>
                        {complaint.assignedTo ?? '—'}
                      </strong>
                    </div>

                    <div>
                      <span>Hostel</span>
                      <strong>
                        {complaint.hostel?.name ??
                          complaint.hostelId}
                      </strong>
                    </div>
                  </div>

                  <div className="mobile-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        void openDetails(
                          complaint,
                        )
                      }
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        openEditForm(complaint)
                      }
                    >
                      Edit
                    </button>
                  </div>
                </article>
              ))}
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
            onSubmit={saveComplaint}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  Hostel Operations
                </div>

                <h2>
                  {editingComplaint
                    ? 'Edit Complaint'
                    : 'New Complaint'}
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
                    disabled={Boolean(
                      editingComplaint,
                    )}
                  />
                </label>

                <label>
                  <span>Student ID</span>

                  <input
                    value={form.studentId}
                    onChange={(event) =>
                      updateForm(
                        'studentId',
                        event.target.value,
                      )
                    }
                    placeholder="Optional student ID"
                    disabled={Boolean(
                      editingComplaint,
                    )}
                  />
                </label>

                <label className="full-width">
                  <span>Subject *</span>

                  <input
                    value={form.subject}
                    onChange={(event) =>
                      updateForm(
                        'subject',
                        event.target.value,
                      )
                    }
                    placeholder="Complaint subject"
                  />
                </label>

                <label className="full-width">
                  <span>Description *</span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        'description',
                        event.target.value,
                      )
                    }
                    rows={5}
                    placeholder="Describe the complaint"
                  />
                </label>

                <label>
                  <span>Priority</span>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      updateForm(
                        'priority',
                        event.target.value,
                      )
                    }
                  >
                    {PRIORITIES.filter(
                      (value) => value !== 'ALL',
                    ).map((value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {formatLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Assigned To</span>

                  <input
                    value={form.assignedTo}
                    onChange={(event) =>
                      updateForm(
                        'assignedTo',
                        event.target.value,
                      )
                    }
                    placeholder="Staff / user ID"
                  />
                </label>

                {editingComplaint && (
                  <>
                    <label>
                      <span>Status</span>

                      <select
                        value={form.status}
                        onChange={(event) =>
                          updateForm(
                            'status',
                            event.target.value,
                          )
                        }
                      >
                        {STATUSES.filter(
                          (value) =>
                            value !== 'ALL',
                        ).map((value) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {formatLabel(value)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Resolution</span>

                      <textarea
                        value={form.resolution}
                        onChange={(event) =>
                          updateForm(
                            'resolution',
                            event.target.value,
                          )
                        }
                        rows={3}
                        placeholder="Resolution details"
                      />
                    </label>
                  </>
                )}
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
                  : editingComplaint
                    ? 'Save Changes'
                    : 'Create Complaint'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedComplaint && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedComplaint(null);
            }
          }}
        >
          <div
            className="modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="complaint-detail-title"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  Complaint Details
                </div>

                <h2 id="complaint-detail-title">
                  {selectedComplaint.subject}
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setSelectedComplaint(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="detail-badges">
                <span
                  className={`priority-badge ${badgeClass(
                    selectedComplaint.priority,
                  )}`}
                >
                  {formatLabel(
                    selectedComplaint.priority,
                  )}
                </span>

                <span
                  className={`status-badge ${badgeClass(
                    selectedComplaint.status,
                  )}`}
                >
                  {formatLabel(
                    selectedComplaint.status,
                  )}
                </span>
              </div>

              <div className="detail-grid">
                <div>
                  <span>Student</span>
                  <strong>
                    {selectedComplaint.student
                      ?.name ??
                      'General Complaint'}
                  </strong>
                </div>

                <div>
                  <span>Admission Number</span>
                  <strong>
                    {
                      selectedComplaint.student
                        ?.admissionNumber
                    }
                  </strong>
                </div>

                <div>
                  <span>Hostel</span>
                  <strong>
                    {selectedComplaint.hostel?.name ??
                      selectedComplaint.hostelId}
                  </strong>
                </div>

                <div>
                  <span>Assigned To</span>
                  <strong>
                    {selectedComplaint.assignedTo ??
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Created At</span>
                  <strong>
                    {formatDateTime(
                      selectedComplaint.createdAt,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Resolved At</span>
                  <strong>
                    {formatDateTime(
                      selectedComplaint.resolvedAt,
                    )}
                  </strong>
                </div>
              </div>

              <div className="detail-section">
                <span>Description</span>

                <p>
                  {selectedComplaint.description}
                </p>
              </div>

              <div className="detail-section">
                <span>Resolution</span>

                <p>
                  {selectedComplaint.resolution ??
                    'No resolution recorded.'}
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setSelectedComplaint(null)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  const complaint =
                    selectedComplaint;

                  setSelectedComplaint(null);
                  openEditForm(complaint);
                }}
              >
                Edit Complaint
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .complaints-page {
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
          font-size: 20px;
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
            minmax(220px, 2fr)
            minmax(150px, 1fr)
            minmax(150px, 1fr)
            auto
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
          min-width: 1050px;
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
          line-height: 1.4;
        }

        .priority-badge,
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
          white-space: nowrap;
        }

        .priority-badge.low {
          background: #f3f4f6;
          color: #4b5563;
        }

        .priority-badge.medium {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .priority-badge.high {
          background: #fff7ed;
          color: #c2410c;
        }

        .priority-badge.urgent {
          background: #fef2f2;
          color: #b91c1c;
        }

        .status-badge.open {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .status-badge.in_progress {
          background: #fff7ed;
          color: #c2410c;
        }

        .status-badge.resolved,
        .status-badge.closed {
          background: #f0fdf4;
          color: #15803d;
        }

        .status-badge.rejected {
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

        .complaint-card {
          padding: 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .complaint-card:last-child {
          border-bottom: 0;
        }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .complaint-card h3 {
          margin: 0;
          color: var(--foreground, #111827);
          font-size: 15px;
        }

        .complaint-card p {
          margin: 4px 0 0;
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .card-description {
          margin-top: 14px !important;
          color: var(--foreground, #374151) !important;
          font-size: 13px !important;
          line-height: 1.55;
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
        .detail-section > span {
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
          width: min(700px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
          background: var(--bg, #ffffff);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }

        .detail-modal {
          width: min(650px, 100%);
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

        .detail-badges {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .detail-section {
          padding-top: 18px;
          margin-top: 18px;
          border-top: 1px solid var(--border, #e5e7eb);
        }

        .detail-section p {
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

          .search-field {
            grid-column: 1 / -1;
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

          .filter-row {
            grid-template-columns: 1fr;
          }

          .search-field {
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

          .card-details {
            grid-template-columns: 1fr;
          }
        }
      `}
      </style>
    </div>
  );
}