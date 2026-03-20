'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const LAST_TENANT_KEY = 'riselocal:last-tenant';

function toTenantLabel(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function HomePage() {
  const [tenantHint, setTenantHint] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const tenantFromQuery = params.get('tenant');
    const normalized = (tenantFromQuery ?? '').trim().toLowerCase();
    if (normalized) {
      setTenantHint(normalized);
      localStorage.setItem(LAST_TENANT_KEY, normalized);
      return;
    }

    const fromStorage = localStorage.getItem(LAST_TENANT_KEY);
    setTenantHint(fromStorage && fromStorage.trim().length > 0 ? fromStorage.trim().toLowerCase() : null);
  }, []);

  const loginHref = useMemo(() => {
    if (!tenantHint) return '/login';
    return `/login?tenant=${encodeURIComponent(tenantHint)}`;
  }, [tenantHint]);

  const tenantLabel = tenantHint ? toTenantLabel(tenantHint) : null;

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
        background: 'radial-gradient(1200px 600px at 50% -10%, #dbeafe 0%, #f7f9fc 45%, #eef2ff 100%)',
      }}
    >
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', marginBottom: '0.8rem', letterSpacing: '-0.5px' }}>
        Welcome to RiseLocal
      </h1>
      <p style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.9rem)', color: '#4b5563', marginBottom: '1.2rem' }}>
        Your Multi-Tenant SaaS Platform
      </p>

      {tenantLabel ? (
        <p
          style={{
            margin: '0 0 2rem',
            fontSize: '0.95rem',
            color: '#1d4ed8',
            background: '#e0ecff',
            border: '1px solid #bfdbfe',
            borderRadius: 999,
            padding: '7px 14px',
            fontWeight: 600,
          }}
        >
          Continue as {tenantLabel}
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/admin"
          style={{
            padding: '16px 34px',
            background: '#1d4ed8',
            color: 'white',
            borderRadius: '14px',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 700,
            minWidth: 240,
            boxShadow: '0 10px 24px rgba(29,78,216,0.28)',
          }}
        >
          Admin Dashboard
        </Link>
        <Link
          href={loginHref}
          style={{
            padding: '16px 34px',
            background: '#1f2937',
            color: 'white',
            borderRadius: '14px',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 700,
            minWidth: 180,
            boxShadow: '0 10px 24px rgba(31,41,55,0.22)',
          }}
        >
          {tenantLabel ? `Login to ${tenantLabel}` : 'Login'}
        </Link>
      </div>
    </div>
  );
}
