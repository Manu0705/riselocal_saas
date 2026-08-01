import {
  leadStatusToUiLabel,
  normalizeLeadStatus,
  type LeadStatus,
} from '@saas/domain-core/lead.contract';

type Props = {
  status: string;
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: '#2563eb',
  CONTACTED: '#f59e0b',
  QUALIFIED: '#10b981',
  CONVERTED: '#14b8a6',
  CLOSED: '#ef4444',
};

export default function LeadStatus({ status }: Props) {
  const canonical = normalizeLeadStatus(status);
  const color = STATUS_COLORS[canonical] ?? '#6b7280';
  const label = leadStatusToUiLabel(canonical);

  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 999,
        background: `${color}22`,
        color,
        fontWeight: 600,
        fontSize: 12,
        minWidth: 80,
        textAlign: 'center',
      }}
    >
      {label}
    </span>
  );
}
