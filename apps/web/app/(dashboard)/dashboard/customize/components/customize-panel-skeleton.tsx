export default function CustomizePanelSkeleton({ title = 'Loading...' }: Readonly<{ title?: string }>) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          border: '1px solid var(--card-border)',
          background: 'var(--card)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            width: 160,
            height: 16,
            borderRadius: 999,
            background: '#e5e7eb',
            marginBottom: 10,
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: '70%',
            height: 14,
            borderRadius: 999,
            background: '#e5e7eb',
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      </div>

      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          style={{
            border: '1px solid var(--card-border)',
            background: 'var(--card)',
            borderRadius: 12,
            padding: 16,
            display: 'grid',
            gap: 12,
          }}
        >
          <div
            style={{
              width: index === 0 ? 100 : 140,
              height: 14,
              borderRadius: 999,
              background: '#e5e7eb',
              animation: 'pulse 1.4s ease-in-out infinite',
            }}
          />
          <div
            style={{
              width: '100%',
              height: 42,
              borderRadius: 10,
              background: '#e5e7eb',
              animation: 'pulse 1.4s ease-in-out infinite',
            }}
          />
        </div>
      ))}
    </div>
  );
}