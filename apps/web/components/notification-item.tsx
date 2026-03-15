import type { LucideIcon } from 'lucide-react';

type NotificationItemProps = {
  icon: LucideIcon;
  title: string;
  time: string;
  onClick?: () => void;
};

export default function NotificationItem({
  icon: Icon,
  title,
  time,
  onClick,
}: Readonly<NotificationItemProps>) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        border: '1px solid var(--card-border)',
        borderRadius: 14,
        background: 'var(--card)',
        boxShadow: '0 6px 16px var(--shadow)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Icon size={18} color="var(--text)" />
        <span
          style={{
            color: 'var(--text)',
            fontWeight: 600,
            fontSize: 14,
            textAlign: 'left',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </span>
      </div>
      <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
        {time}
      </span>
    </button>
  );
}
