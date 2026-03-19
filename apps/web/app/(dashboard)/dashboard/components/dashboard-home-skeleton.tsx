export default function DashboardHomeSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          marginBottom: 12,
          border: '1px solid #bfdbfe',
          background: '#eff6ff',
          borderRadius: 10,
          padding: '10px 12px',
          color: '#1e3a8a',
          fontSize: 13,
        }}
      >
        Loading dashboard data. If this is the first visit in a while, backend wake-up can take around 20-60 seconds.
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            width: 100,
            height: 28,
            borderRadius: 8,
            background: '#e5e7eb',
            marginBottom: 10,
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: '75%',
            height: 16,
            borderRadius: 8,
            background: '#e5e7eb',
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            style={{
              border: '1px solid var(--card-border)',
              background: 'var(--card)',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 4px 12px var(--shadow)',
            }}
          >
            <div
              style={{
                width: '45%',
                height: 12,
                borderRadius: 999,
                background: '#e5e7eb',
                animation: 'pulse 1.4s ease-in-out infinite',
              }}
            />
            <div
              style={{
                width: '35%',
                height: 28,
                marginTop: 12,
                borderRadius: 10,
                background: '#e5e7eb',
                animation: 'pulse 1.4s ease-in-out infinite',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 18, marginTop: 22 }}>
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            style={{
              border: '1px solid var(--card-border)',
              background: 'var(--card)',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div
              style={{
                width: '30%',
                height: 16,
                borderRadius: 999,
                background: '#e5e7eb',
                marginBottom: 12,
                animation: 'pulse 1.4s ease-in-out infinite',
              }}
            />
            <div style={{ display: 'grid', gap: 10 }}>
              {Array.from({ length: 3 }, (_, row) => (
                <div
                  key={row}
                  style={{
                    width: '100%',
                    height: 14,
                    borderRadius: 999,
                    background: '#e5e7eb',
                    animation: 'pulse 1.4s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}