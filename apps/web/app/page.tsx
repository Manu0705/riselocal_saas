import Link from 'next/link';

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to RiseLocal</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
        Your Multi-Tenant SaaS Platform
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/admin"
          style={{
            padding: '12px 24px',
            background: '#0070f3',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          Admin Dashboard
        </Link>
        <Link
          href="/login"
          style={{
            padding: '12px 24px',
            background: '#24292e',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          Login
        </Link>
      </div>
    </div>
  );
}
