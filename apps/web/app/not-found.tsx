import Link from 'next/link';

export default function NotFound() {
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
      <h1 style={{ fontSize: '6rem', margin: 0, color: '#333' }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
        Tenant Not Found
      </h2>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem', maxWidth: '500px' }}>
        The tenant you are trying to access does not exist or has been removed. Please check the URL
        and try again.
      </p>
      <Link
        href="/"
        style={{
          padding: '12px 24px',
          background: '#0070f3',
          color: 'white',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '1rem',
        }}
      >
        Go to Home
      </Link>
    </div>
  );
}
