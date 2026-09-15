'use client';

import { useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api-client';

type ReportType =
  | 'fee-collection-summary'
  | 'student-outstanding'
  | 'invoices'
  | 'payments'
  | 'receipts';

type ReportItem = Record<string, unknown>;

type ReportResponse = {
  items?: ReportItem[];
  data?: ReportItem[];
  total?: number;
  summary?: ReportItem;
};

const REPORTS: {
  key: ReportType;
  label: string;
  description: string;
}[] = [
  {
    key: 'fee-collection-summary',
    label: 'Fee Collection',
    description: 'Collection totals and payment status summary',
  },
  {
    key: 'student-outstanding',
    label: 'Student Outstanding',
    description: 'Students with pending balances',
  },
  {
    key: 'invoices',
    label: 'Invoices',
    description: 'Invoice and billing report',
  },
  {
    key: 'payments',
    label: 'Payments',
    description: 'Payment transactions and verification status',
  },
  {
    key: 'receipts',
    label: 'Receipts',
    description: 'Generated payment receipts',
  },
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return value.toLocaleString('en-IN');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateValue(value: unknown): string {
  if (!value) return '—';

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return formatValue(value);
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isDateKey(key: string): boolean {
  return (
    key.toLowerCase().includes('date') ||
    key.toLowerCase().endsWith('at')
  );
}

function getRows(response: ReportResponse | ReportItem[]): ReportItem[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function getSummaryEntries(
  response: ReportResponse | ReportItem[],
): [string, unknown][] {
  if (Array.isArray(response)) {
    return [];
  }

  if (!response.summary || typeof response.summary !== 'object') {
    return [];
  }

  return Object.entries(response.summary);
}

export default function HostelReportsPage() {
  const [activeReport, setActiveReport] =
    useState<ReportType>('fee-collection-summary');

  const [rows, setRows] = useState<ReportItem[]>([]);
  const [summary, setSummary] = useState<[string, unknown][]>([]);
  const [total, setTotal] = useState(0);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeReportInfo = REPORTS.find(
    (report) => report.key === activeReport,
  );

  async function loadReport() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
      });

      if (from) {
        params.set('from', from);
      }

      if (to) {
        params.set('to', to);
      }

      const response = (await api.get(
        `/hostel/reports/${activeReport}?${params.toString()}`,
      )) as ReportResponse | ReportItem[];

      setRows(getRows(response));
      setSummary(getSummaryEntries(response));

      if (!Array.isArray(response) && typeof response.total === 'number') {
        setTotal(response.total);
      } else {
        setTotal(getRows(response).length);
      }
    } catch (err) {
      console.error('Failed to load hostel report:', err);

      setRows([]);
      setSummary([]);
      setTotal(0);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load the selected report.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
  }, [activeReport]);

  const columns = useMemo(() => {
    if (!rows.length) {
      return [];
    }

    const keys = new Set<string>();

    rows.forEach((row) => {
      Object.keys(row).forEach((key) => keys.add(key));
    });

    return Array.from(keys).slice(0, 8);
  }, [rows]);

  return (
    <div className="hostel-reports-page">
      <style jsx>{`
        .hostel-reports-page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .page-title {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: var(--foreground, #111827);
        }

        .page-description {
          margin: 6px 0 0;
          color: var(--muted-foreground, #6b7280);
          font-size: 14px;
        }

        .report-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin-bottom: 20px;
        }

        .report-tab {
          flex: 0 0 auto;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--background, #ffffff);
          color: var(--foreground, #374151);
          border-radius: 10px;
          padding: 11px 15px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .report-tab:hover {
          border-color: var(--foreground, #9ca3af);
        }

        .report-tab.active {
          background: var(--foreground, #111827);
          color: var(--background, #ffffff);
          border-color: var(--foreground, #111827);
        }

        .filters {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          padding: 16px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 14px;
          background: var(--card, #ffffff);
          margin-bottom: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted-foreground, #6b7280);
        }

        .date-input {
          min-width: 160px;
          height: 40px;
          padding: 0 11px;
          border: 1px solid var(--border, #d1d5db);
          border-radius: 9px;
          background: var(--background, #ffffff);
          color: var(--foreground, #111827);
          outline: none;
        }

        .date-input:focus {
          border-color: var(--foreground, #6b7280);
        }

        .button {
          height: 40px;
          border: 0;
          border-radius: 9px;
          padding: 0 16px;
          cursor: pointer;
          font-weight: 600;
          background: var(--foreground, #111827);
          color: var(--background, #ffffff);
        }

        .button.secondary {
          background: var(--secondary, #f3f4f6);
          color: var(--foreground, #111827);
          border: 1px solid var(--border, #e5e7eb);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .summary-card {
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 14px;
          background: var(--card, #ffffff);
          padding: 17px;
          min-width: 0;
        }

        .summary-label {
          color: var(--muted-foreground, #6b7280);
          font-size: 12px;
          margin-bottom: 8px;
        }

        .summary-value {
          color: var(--foreground, #111827);
          font-size: 22px;
          font-weight: 700;
          word-break: break-word;
        }

        .report-card {
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 14px;
          background: var(--card, #ffffff);
          overflow: hidden;
        }

        .report-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 17px 18px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .report-card-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: var(--foreground, #111827);
        }

        .report-count {
          font-size: 13px;
          color: var(--muted-foreground, #6b7280);
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        th,
        td {
          padding: 13px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border, #e5e7eb);
          font-size: 13px;
        }

        th {
          background: var(--secondary, #f9fafb);
          color: var(--muted-foreground, #6b7280);
          font-weight: 700;
          white-space: nowrap;
        }

        td {
          color: var(--foreground, #374151);
        }

        tr:last-child td {
          border-bottom: 0;
        }

        .mobile-list {
          display: none;
        }

        .mobile-item {
          padding: 15px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }

        .mobile-item:last-child {
          border-bottom: 0;
        }

        .mobile-field {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 5px 0;
        }

        .mobile-field-label {
          color: var(--muted-foreground, #6b7280);
          font-size: 12px;
          flex: 0 0 42%;
        }

        .mobile-field-value {
          color: var(--foreground, #111827);
          font-size: 13px;
          font-weight: 600;
          text-align: right;
          word-break: break-word;
        }

        .empty-state {
          padding: 48px 20px;
          text-align: center;
          color: var(--muted-foreground, #6b7280);
          font-size: 14px;
        }

        .error-state {
          padding: 14px 16px;
          margin-bottom: 20px;
          border: 1px solid #ef4444;
          border-radius: 10px;
          color: #b91c1c;
          background: #fef2f2;
          font-size: 14px;
        }

        .loading {
          padding: 48px 20px;
          text-align: center;
          color: var(--muted-foreground, #6b7280);
        }

        @media (max-width: 900px) {
          .page-header {
            margin-bottom: 18px;
          }

          .page-title {
            font-size: 24px;
          }

          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filters {
            align-items: stretch;
          }

          .filter-group {
            flex: 1 1 150px;
          }

          .date-input {
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }

          .button {
            flex: 1 1 120px;
          }

          .table-wrapper {
            display: none;
          }

          .mobile-list {
            display: block;
          }
        }

        @media (max-width: 560px) {
          .page-title {
            font-size: 22px;
          }

          .page-description {
            font-size: 13px;
          }

          .report-tabs {
            margin-right: -4px;
          }

          .report-tab {
            padding: 10px 12px;
            font-size: 13px;
          }

          .summary-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .summary-card {
            padding: 13px;
          }

          .summary-value {
            font-size: 18px;
          }

          .filters {
            padding: 13px;
          }

          .filter-group {
            flex-basis: 100%;
          }

          .button {
            width: 100%;
          }

          .report-card-header {
            padding: 14px;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-description">
            View hostel financial and operational reports.
          </p>
        </div>
      </div>

      <div className="report-tabs">
        {REPORTS.map((report) => (
          <button
            key={report.key}
            type="button"
            className={`report-tab ${
              activeReport === report.key ? 'active' : ''
            }`}
            onClick={() => setActiveReport(report.key)}
          >
            {report.label}
          </button>
        ))}
      </div>

      <div className="filters">
        <div className="filter-group">
          <label className="filter-label" htmlFor="report-from">
            From
          </label>
          <input
            id="report-from"
            className="date-input"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="report-to">
            To
          </label>
          <input
            id="report-to"
            className="date-input"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="button"
          onClick={() => void loadReport()}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Apply Filters'}
        </button>

        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setFrom('');
            setTo('');
            window.setTimeout(() => {
              void loadReport();
            }, 0);
          }}
          disabled={loading}
        >
          Clear
        </button>
      </div>

      {error ? <div className="error-state">{error}</div> : null}

      {summary.length > 0 ? (
        <div className="summary-grid">
          {summary.slice(0, 8).map(([key, value]) => (
            <div className="summary-card" key={key}>
              <div className="summary-label">{formatLabel(key)}</div>
              <div className="summary-value">
                {isDateKey(key)
                  ? formatDateValue(value)
                  : formatValue(value)}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="report-card">
        <div className="report-card-header">
          <div>
            <h2 className="report-card-title">
              {activeReportInfo?.label ?? 'Report'}
            </h2>
            <div className="report-count">
              {activeReportInfo?.description}
            </div>
          </div>

          <div className="report-count">
            {total} {total === 1 ? 'record' : 'records'}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading report...</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            No records found for this report.
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column}>{formatLabel(column)}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    <tr key={String(row.id ?? index)}>
                      {columns.map((column) => (
                        <td key={column}>
                          {isDateKey(column)
                            ? formatDateValue(row[column])
                            : formatValue(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-list">
              {rows.map((row, index) => (
                <div className="mobile-item" key={String(row.id ?? index)}>
                  {columns.map((column) => (
                    <div className="mobile-field" key={column}>
                      <span className="mobile-field-label">
                        {formatLabel(column)}
                      </span>
                      <span className="mobile-field-value">
                        {isDateKey(column)
                          ? formatDateValue(row[column])
                          : formatValue(row[column])}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}