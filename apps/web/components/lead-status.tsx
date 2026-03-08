type Props = {
  status: string
}

export default function LeadStatus({ status }: Props) {
  const color =
    status === 'New'
      ? '#2563eb'
      : status === 'Contacted'
      ? '#f59e0b'
      : status === 'Follow-Up'
      ? '#10b981'
      : status === 'Converted'
      ? '#14b8a6'
      : status === 'Lost'
      ? '#ef4444'
      : '#6b7280'

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
      {status}
    </span>
  )
}
