type StatCardProps = {
  label: string;
  value: number | string;
  valueColor?: string;
};

export default function StatCard({
  label,
  value,
  valueColor = 'var(--text)',
}: Readonly<StatCardProps>) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 14,
        boxShadow: '0 8px 20px var(--shadow)',
        padding: 14,
        minHeight: 88,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: 'var(--muted)',
          fontWeight: 500,
          lineHeight: '16px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 28,
          fontWeight: 700,
          color: valueColor,
          letterSpacing: '-0.5px',
          lineHeight: '30px',
        }}
      >
        {value}
      </p>
    </div>
  );
}
