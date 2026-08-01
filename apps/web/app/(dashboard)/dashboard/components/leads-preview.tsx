'use client';

import LeadStatusBadge from '@/components/lead-status';
import { useDashboardData } from '@/context/DashboardDataContext';
import {
  LEAD_STATUSES,
  leadStatusToUiLabel,
  normalizeLeadStatus,
  type LeadStatus,
} from '@saas/domain-core/lead.contract';

function formatLeadDate(dateText?: string): string {
  if (!dateText) return '-';
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  });
}

export default function LeadsPreview() {
  const { leads } = useDashboardData();

  const groupedByStatus = LEAD_STATUSES.map((status: LeadStatus) => {
    const latest = leads
      .filter((lead) => normalizeLeadStatus(lead?.status) === status)
      .sort((left, right) => {
        const leftDate = new Date(left?.createdAt ?? 0).getTime();
        const rightDate = new Date(right?.createdAt ?? 0).getTime();
        return rightDate - leftDate;
      })[0];

    return {
      date: formatLeadDate(latest?.createdAt),
      status,
      label: leadStatusToUiLabel(status),
    };
  });

  return (
    <div style={{ marginTop: 20 }}>
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text)',
          letterSpacing: '-0.3px',
        }}
      >
        Leads Summary
      </h3>

      <div
        style={{
          border: '1px solid var(--card-border)',
          borderRadius: 12,
          padding: 12,
          marginTop: 10,
          background: 'var(--card)',
          boxShadow: '0 4px 12px var(--shadow)',
        }}
      >
        {groupedByStatus.map((l, i) => (
          <div
            key={`${l.date}-${l.status}-${i}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: i === leads.length - 1 ? 'none' : '1px solid var(--card-border)',
            }}
          >
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{l.date}</span>
            <LeadStatusBadge status={l.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
