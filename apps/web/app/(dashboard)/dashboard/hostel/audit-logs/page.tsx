'use client';

import { useMemo, useState } from 'react';

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  user: string;
  role: string;
  timestamp: string;
  details?: string;
};

const DEMO_LOGS: AuditLog[] = [];

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return DEMO_LOGS.filter((log) => {
      const matchesSearch =
        !query ||
        log.action.toLowerCase().includes(query) ||
        log.entity.toLowerCase().includes(query) ||
        log.user.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query);

      const matchesAction =
        actionFilter === 'ALL' || log.action === actionFilter;

      const matchesEntity =
        entityFilter === 'ALL' || log.entity === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [search, actionFilter, entityFilter]);

  return (
    <section
      style={{
        width: '100%',
        maxWidth: 1400,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--foreground)',
            }}
          >
            Audit Logs
          </h1>

          <p
            style={{
              margin: '6px 0 0',
              color: 'var(--muted-foreground)',
              fontSize: 14,
            }}
          >
            Track important actions and changes made in the hostel system.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1fr) 180px 180px',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search audit logs..."
          style={{
            width: '100%',
            height: 42,
            padding: '0 14px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--background)',
            color: 'var(--foreground)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{
            height: 42,
            padding: '0 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--background)',
            color: 'var(--foreground)',
          }}
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="PAYMENT">Payment</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          style={{
            height: 42,
            padding: '0 12px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--background)',
            color: 'var(--foreground)',
          }}
        >
          <option value="ALL">All Entities</option>
          <option value="STUDENT">Student</option>
          <option value="ROOM">Room</option>
          <option value="FEE">Fee</option>
          <option value="PAYMENT">Payment</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>

      {/* Desktop table */}
      <div
        className="audit-logs-desktop"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--background)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.5fr',
            gap: 12,
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--muted-foreground)',
          }}
        >
          <span>Action</span>
          <span>Entity</span>
          <span>User</span>
          <span>Role</span>
          <span>Date & Time</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div
            style={{
              padding: '64px 20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 36,
                marginBottom: 12,
              }}
            >
              📝
            </div>

            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--foreground)',
              }}
            >
              No audit logs found
            </h3>

            <p
              style={{
                margin: '8px auto 0',
                maxWidth: 460,
                fontSize: 13,
                color: 'var(--muted-foreground)',
                lineHeight: 1.6,
              }}
            >
              Audit activity will appear here once audit logging is connected
              to the Hostel backend.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.5fr',
                gap: 12,
                padding: '16px',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
                color: 'var(--foreground)',
              }}
            >
              <strong>{log.action}</strong>
              <span>{log.entity}</span>
              <span>{log.user}</span>
              <span>{log.role}</span>
              <span>{log.timestamp}</span>
            </div>
          ))
        )}
      </div>

      {/* Mobile cards */}
      <div
        className="audit-logs-mobile"
        style={{
          display: 'none',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              border: '1px solid var(--border)',
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>📝</div>

            <strong
              style={{
                display: 'block',
                color: 'var(--foreground)',
              }}
            >
              No audit logs found
            </strong>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--muted-foreground)',
              }}
            >
              Audit activity will appear here once logging is connected.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: 16,
                marginBottom: 12,
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--background)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <strong>{log.action}</strong>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {log.entity}
                </span>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: 'var(--muted-foreground)',
                  lineHeight: 1.7,
                }}
              >
                <div>User: {log.user}</div>
                <div>Role: {log.role}</div>
                <div>{log.timestamp}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .audit-logs-desktop {
            display: none !important;
          }

          .audit-logs-mobile {
            display: block !important;
          }
        }

        @media (max-width: 700px) {
          section {
            padding: 0;
          }

          h1 {
            font-size: 24px !important;
          }

          .audit-logs-mobile {
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          div[style*='grid-template-columns: minmax(220px, 1fr)'] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}