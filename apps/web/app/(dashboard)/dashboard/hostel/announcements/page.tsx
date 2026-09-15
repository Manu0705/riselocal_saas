'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api-client';

type AnnouncementAudience =
  | 'ALL'
  | 'STUDENTS'
  | 'STAFF';

type AnnouncementStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ARCHIVED';

type Announcement = {
  id: string;
  tenantId?: string;
  hostelId?: string | null;
  title: string;
  message: string;
  audience?: AnnouncementAudience | string | null;
  publishAt?: string | null;
  expiresAt?: string | null;
  status?: AnnouncementStatus | string | null;
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

type AnnouncementsResponse = {
  items: Announcement[];
  pagination?: Pagination;
  total?: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type AnnouncementForm = {
  hostelId: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  publishAt: string;
  expiresAt: string;
};

const PAGE_LIMIT = 10;

const AUDIENCES = [
  'ALL',
  'STUDENTS',
  'STAFF',
];

const STATUSES = [
  'ALL',
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
];

const EMPTY_FORM: AnnouncementForm = {
  hostelId: '',
  title: '',
  message: '',
  audience: 'ALL',
  publishAt: '',
  expiresAt: '',
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

function formatDateTimeInput(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    '0',
  );
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(
    2,
    '0',
  );

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function badgeClass(value?: string | null) {
  return (value ?? 'unknown').toLowerCase();
}

export default function HostelAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [audience, setAudience] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  const [form, setForm] =
    useState<AnnouncementForm>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(
    null,
  );

  async function loadAnnouncements() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (audience !== 'ALL') {
        params.set('audience', audience);
      }

      if (status !== 'ALL') {
        params.set('status', status);
      }

      const response = await api.get<
        ApiResponse<AnnouncementsResponse>
      >(
        `/hostel/announcements?${params.toString()}`,
      );

      const data = response.data;

      setAnnouncements(data?.items ?? []);

      if (data?.pagination) {
        setPagination(data.pagination);
      } else {
        const total = Number(data?.total ?? 0);

        setPagination({
          page,
          limit: PAGE_LIMIT,
          total,
          totalPages: Math.max(
            1,
            Math.ceil(total / PAGE_LIMIT),
          ),
        });
      }
    } catch (err) {
      setAnnouncements([]);
      setPagination(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load announcements.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnnouncements();
  }, [page, search, audience, status]);

  const summary = useMemo(() => {
    let drafts = 0;
    let published = 0;
    let archived = 0;

    announcements.forEach((announcement) => {
      const currentStatus =
        announcement.status?.toUpperCase();

      if (currentStatus === 'DRAFT') {
        drafts += 1;
      }

      if (currentStatus === 'PUBLISHED') {
        published += 1;
      }

      if (currentStatus === 'ARCHIVED') {
        archived += 1;
      }
    });

    return {
      drafts,
      published,
      archived,
      total: pagination?.total ?? announcements.length,
    };
  }, [announcements, pagination]);

  function applySearch(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSearch(searchInput.trim());
    setPage(1);
  }

  function resetFilters() {
    setSearchInput('');
    setSearch('');
    setAudience('ALL');
    setStatus('ALL');
    setPage(1);
  }

  function openCreateForm() {
    setEditingAnnouncement(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
    setError('');
  }

  function openEditForm(announcement: Announcement) {
    setEditingAnnouncement(announcement);

    setForm({
      hostelId: announcement.hostelId ?? '',
      title: announcement.title ?? '',
      message: announcement.message ?? '',
      audience:
        (announcement.audience?.toUpperCase() as AnnouncementAudience) ??
        'ALL',
      publishAt: formatDateTimeInput(
        announcement.publishAt,
      ),
      expiresAt: formatDateTimeInput(
        announcement.expiresAt,
      ),
    });

    setShowForm(true);
    setError('');
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingAnnouncement(null);
  }

  function updateForm(
    field: keyof AnnouncementForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toIsoDate(
    value: string,
  ): string | undefined {
    if (!value) return undefined;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date.toISOString();
  }

  async function saveAnnouncement(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!form.message.trim()) {
      setError('Message is required.');
      return;
    }

    const publishAt = toIsoDate(form.publishAt);
    const expiresAt = toIsoDate(form.expiresAt);

    if (
      publishAt &&
      expiresAt &&
      new Date(expiresAt) < new Date(publishAt)
    ) {
      setError(
        'Expiry date cannot be before the publish date.',
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        hostelId:
          form.hostelId.trim() || undefined,
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        publishAt,
        expiresAt,
      };

      if (editingAnnouncement) {
        await api.patch(
          `/hostel/announcements/${encodeURIComponent(
            editingAnnouncement.id,
          )}`,
          payload,
        );
      } else {
        await api.post(
          '/hostel/announcements',
          payload,
        );
      }

      setShowForm(false);
      setEditingAnnouncement(null);

      await loadAnnouncements();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save announcement.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function publishAnnouncement(
    announcement: Announcement,
  ) {
    if (
      !window.confirm(
        'Publish this announcement now?',
      )
    ) {
      return;
    }

    setActionId(announcement.id);
    setError('');

    try {
      await api.post(
        `/hostel/announcements/${encodeURIComponent(
          announcement.id,
        )}/publish`,
        {},
      );

      await loadAnnouncements();

      if (
        selectedAnnouncement?.id ===
        announcement.id
      ) {
        setSelectedAnnouncement(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to publish announcement.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function archiveAnnouncement(
    announcement: Announcement,
  ) {
    if (
      !window.confirm(
        'Archive this announcement?',
      )
    ) {
      return;
    }

    setActionId(announcement.id);
    setError('');

    try {
      await api.post(
        `/hostel/announcements/${encodeURIComponent(
          announcement.id,
        )}/archive`,
        {},
      );

      await loadAnnouncements();

      if (
        selectedAnnouncement?.id ===
        announcement.id
      ) {
        setSelectedAnnouncement(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to archive announcement.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function openDetails(
    announcement: Announcement,
  ) {
    setError('');

    try {
      const response = await api.get<
        ApiResponse<Announcement>
      >(
        `/hostel/announcements/${encodeURIComponent(
          announcement.id,
        )}`,
      );

      setSelectedAnnouncement(
        response.data ?? announcement,
      );
    } catch (err) {
      setSelectedAnnouncement(announcement);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load announcement details.',
      );
    }
  }

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="announcements-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">
            Hostel Communication
          </div>

          <h1>Announcements</h1>

          <p>
            Publish important updates and notices for
            hostel students and staff.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateForm}
        >
          + New Announcement
        </button>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>

        <div className="summary-card">
          <span>Drafts</span>
          <strong>{summary.drafts}</strong>
        </div>

        <div className="summary-card">
          <span>Published</span>
          <strong>{summary.published}</strong>
        </div>

        <div className="summary-card">
          <span>Archived</span>
          <strong>{summary.archived}</strong>
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
              placeholder="Search title or message"
            />
          </label>

          <label>
            <span>Audience</span>

            <select
              value={audience}
              onChange={(event) => {
                setAudience(event.target.value);
                setPage(1);
              }}
            >
              {AUDIENCES.map((value) => (
                <option key={value} value={value}>
                  {value === 'ALL'
                    ? 'All Audiences'
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
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <strong>No announcements found</strong>

            <span>
              Create an announcement to start communicating
              with hostel users.
            </span>
          </div>
        ) : (
          <>
            <div className="desktop-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Announcement</th>
                    <th>Audience</th>
                    <th>Status</th>
                    <th>Publish Date</th>
                    <th>Expiry</th>
                    <th>Created By</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {announcements.map(
                    (announcement) => {
                      const currentStatus =
                        announcement.status?.toUpperCase();

                      const busy =
                        actionId ===
                        announcement.id;

                      return (
                        <tr
                          key={announcement.id}
                        >
                          <td>
                            <div className="primary-text">
                              {announcement.title}
                            </div>

                            <div className="secondary-text">
                              {announcement.message
                                .length > 80
                                ? `${announcement.message.slice(
                                    0,
                                    80,
                                  )}...`
                                : announcement.message}
                            </div>
                          </td>

                          <td>
                            {formatLabel(
                              announcement.audience,
                            )}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${badgeClass(
                                currentStatus,
                              )}`}
                            >
                              {formatLabel(
                                currentStatus,
                              )}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              announcement.publishAt,
                            )}
                          </td>

                          <td>
                            {formatDate(
                              announcement.expiresAt,
                            )}
                          </td>

                          <td>
                            {announcement.createdBy ??
                              '—'}
                          </td>

                          <td>
                            <div className="actions">
                              <button
                                type="button"
                                className="text-button"
                                onClick={() =>
                                  void openDetails(
                                    announcement,
                                  )
                                }
                              >
                                View
                              </button>

                              {currentStatus !==
                                'ARCHIVED' && (
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() =>
                                    openEditForm(
                                      announcement,
                                    )
                                  }
                                >
                                  Edit
                                </button>
                              )}

                              {currentStatus !==
                                'PUBLISHED' &&
                                currentStatus !==
                                  'ARCHIVED' && (
                                  <button
                                    type="button"
                                    className="text-button"
                                    onClick={() =>
                                      void publishAnnouncement(
                                        announcement,
                                      )
                                    }
                                    disabled={busy}
                                  >
                                    {busy
                                      ? 'Working...'
                                      : 'Publish'}
                                  </button>
                                )}

                              {currentStatus !==
                                'ARCHIVED' && (
                                <button
                                  type="button"
                                  className="danger-button"
                                  onClick={() =>
                                    void archiveAnnouncement(
                                      announcement,
                                    )
                                  }
                                  disabled={busy}
                                >
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobile-list">
              {announcements.map(
                (announcement) => {
                  const currentStatus =
                    announcement.status?.toUpperCase();

                  const busy =
                    actionId === announcement.id;

                  return (
                    <article
                      className="announcement-card"
                      key={announcement.id}
                    >
                      <div className="card-top">
                        <div>
                          <h3>
                            {announcement.title}
                          </h3>

                          <p>
                            {formatDate(
                              announcement.createdAt,
                            )}
                          </p>
                        </div>

                        <span
                          className={`status-badge ${badgeClass(
                            currentStatus,
                          )}`}
                        >
                          {formatLabel(
                            currentStatus,
                          )}
                        </span>
                      </div>

                      <p className="card-message">
                        {announcement.message}
                      </p>

                      <div className="card-details">
                        <div>
                          <span>Audience</span>
                          <strong>
                            {formatLabel(
                              announcement.audience,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Publish</span>
                          <strong>
                            {formatDate(
                              announcement.publishAt,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Expires</span>
                          <strong>
                            {formatDate(
                              announcement.expiresAt,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Created By</span>
                          <strong>
                            {announcement.createdBy ??
                              '—'}
                          </strong>
                        </div>
                      </div>

                      <div className="mobile-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            void openDetails(
                              announcement,
                            )
                          }
                        >
                          View
                        </button>

                        {currentStatus !==
                          'ARCHIVED' && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              openEditForm(
                                announcement,
                              )
                            }
                          >
                            Edit
                          </button>
                        )}

                        {currentStatus !==
                          'PUBLISHED' &&
                          currentStatus !==
                            'ARCHIVED' && (
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                void publishAnnouncement(
                                  announcement,
                                )
                              }
                              disabled={busy}
                            >
                              Publish
                            </button>
                          )}

                        {currentStatus !==
                          'ARCHIVED' && (
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              void archiveAnnouncement(
                                announcement,
                              )
                            }
                            disabled={busy}
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </article>
                  );
                },
              )}
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
            onSubmit={saveAnnouncement}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  Hostel Communication
                </div>

                <h2>
                  {editingAnnouncement
                    ? 'Edit Announcement'
                    : 'New Announcement'}
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
                  <span>Hostel ID</span>

                  <input
                    value={form.hostelId}
                    onChange={(event) =>
                      updateForm(
                        'hostelId',
                        event.target.value,
                      )
                    }
                    placeholder="Optional hostel ID"
                  />
                </label>

                <label>
                  <span>Audience</span>

                  <select
                    value={form.audience}
                    onChange={(event) =>
                      updateForm(
                        'audience',
                        event.target.value,
                      )
                    }
                  >
                    {AUDIENCES.map((value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {formatLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="full-width">
                  <span>Title *</span>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateForm(
                        'title',
                        event.target.value,
                      )
                    }
                    placeholder="Announcement title"
                  />
                </label>

                <label className="full-width">
                  <span>Message *</span>

                  <textarea
                    value={form.message}
                    onChange={(event) =>
                      updateForm(
                        'message',
                        event.target.value,
                      )
                    }
                    rows={6}
                    placeholder="Write the announcement message"
                  />
                </label>

                <label>
                  <span>Publish At</span>

                  <input
                    type="datetime-local"
                    value={form.publishAt}
                    onChange={(event) =>
                      updateForm(
                        'publishAt',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Expires At</span>

                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      updateForm(
                        'expiresAt',
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>

              <div className="form-note">
                New announcements are created as drafts.
                Use Publish after saving when the
                announcement is ready.
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
                  : editingAnnouncement
                    ? 'Save Changes'
                    : 'Create Draft'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedAnnouncement && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedAnnouncement(null);
            }
          }}
        >
          <div
            className="modal detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-detail-title"
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  Announcement Details
                </div>

                <h2 id="announcement-detail-title">
                  {selectedAnnouncement.title}
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setSelectedAnnouncement(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="detail-badges">
                <span
                  className={`status-badge ${badgeClass(
                    selectedAnnouncement.status,
                  )}`}
                >
                  {formatLabel(
                    selectedAnnouncement.status,
                  )}
                </span>

                <span className="audience-badge">
                  {formatLabel(
                    selectedAnnouncement.audience,
                  )}
                </span>
              </div>

              <div className="detail-grid">
                <div>
                  <span>Hostel ID</span>
                  <strong>
                    {selectedAnnouncement.hostelId ??
                      'All Hostels'}
                  </strong>
                </div>

                <div>
                  <span>Created By</span>
                  <strong>
                    {selectedAnnouncement.createdBy ??
                      '—'}
                  </strong>
                </div>

                <div>
                  <span>Publish At</span>
                  <strong>
                    {formatDateTime(
                      selectedAnnouncement.publishAt,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Expires At</span>
                  <strong>
                    {formatDateTime(
                      selectedAnnouncement.expiresAt,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Created At</span>
                  <strong>
                    {formatDateTime(
                      selectedAnnouncement.createdAt,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Updated At</span>
                  <strong>
                    {formatDateTime(
                      selectedAnnouncement.updatedAt,
                    )}
                  </strong>
                </div>
              </div>

              <div className="detail-section">
                <span>Message</span>

                <p>
                  {selectedAnnouncement.message}
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setSelectedAnnouncement(null)
                }
              >
                Close
              </button>

              {selectedAnnouncement.status?.toUpperCase() !==
                'ARCHIVED' && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    const announcement =
                      selectedAnnouncement;

                    setSelectedAnnouncement(null);
                    openEditForm(announcement);
                  }}
                >
                  Edit Announcement
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .announcements-page {
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
          min-width: 1100px;
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
          max-width: 360px;
          margin-top: 4px;
          color: var(--muted, #6b7280);
          font-size: 11px;
          line-height: 1.4;
        }

        .status-badge,
        .audience-badge {
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

        .status-badge.draft {
          background: #fff7ed;
          color: #c2410c;
        }

        .status-badge.published {
          background: #f0fdf4;
          color: #15803d;
        }

        .status-badge.archived {
          background: #f3f4f6;
          color: #6b7280;
        }

        .audience-badge {
          background: #eff6ff;
          color: #1d4ed8;
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

        .announcement-card {
          padding: 16px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .announcement-card:last-child {
          border-bottom: 0;
        }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .announcement-card h3 {
          margin: 0;
          color: var(--foreground, #111827);
          font-size: 15px;
        }

        .announcement-card p {
          margin: 4px 0 0;
          color: var(--muted, #6b7280);
          font-size: 11px;
        }

        .card-message {
          margin-top: 14px !important;
          color: var(--foreground, #374151) !important;
          font-size: 13px !important;
          line-height: 1.55;
          white-space: pre-wrap;
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

        .form-note {
          padding: 11px 12px;
          margin-top: 16px;
          border-radius: 8px;
          background: var(--border, #f3f4f6);
          color: var(--muted, #6b7280);
          font-size: 11px;
          line-height: 1.5;
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
          line-height: 1.65;
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

          .filter-row {
            grid-template-columns: 1fr;
          }

          .search-field {
            grid-column: auto;
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