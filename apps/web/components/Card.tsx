export default function Card({
  title,
  value,
  valueColor,
  children,
}: Readonly<{
  title: string;
  value?: string | number;
  valueColor?: string;
  children?: React.ReactNode;
}>) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        boxShadow: '0 4px 12px var(--shadow)',
        padding: 16,
        minWidth: 0,
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontWeight: 500,
            }}
          >
            {title}
          </div>
          {value !== undefined && (
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                marginTop: 8,
                color: valueColor || 'var(--text)',
                letterSpacing: '-0.5px',
              }}
            >
              {value}
            </div>
          )}
        </div>
        {children && <div style={{ marginLeft: 12 }}>{children}</div>}
      </div>
    </div>
  );
}
