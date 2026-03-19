'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

export const dynamic = 'force-dynamic';

function isLikelyColdStartIssue(message: string | null): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('timed out') ||
    normalized.includes('server returned html') ||
    normalized.includes('unexpected token')
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = searchParams.get('tenant');

  const { login: loginWithContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);

    try {
      const data = await login(email, password, tenant ?? undefined);

      const apiError = data?.error || data?.message;
      if (apiError && !data?.token) {
        setError(String(apiError));
        return;
      }

      if (!data?.token) {
        setError('Login failed. Please check your credentials and try again.');
        return;
      }

      const tenantSlugFromServer = data?.user?.tenantSlug;
      const userNameFromServer = data?.user?.name;
      loginWithContext(data.token, tenant ?? tenantSlugFromServer, userNameFromServer);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <h1>Login</h1>

      {error ? (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            background: '#fee',
            border: '1px solid #fbb',
            borderRadius: 8,
            color: '#900',
          }}
        >
          {error}
          {isLikelyColdStartIssue(error) ? (
            <div style={{ marginTop: 8, fontSize: 13, color: '#7f1d1d' }}>
              The API may be waking up from cold start. Wait 20-60 seconds and try again.
            </div>
          ) : null}
        </div>
      ) : null}

      {!error ? (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            color: '#1e3a8a',
            fontSize: 13,
          }}
        >
          First login after inactivity can take 20-60 seconds while the backend wakes up.
        </div>
      ) : null}

      <input
        value={email}
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          marginBottom: 10,
          borderRadius: 8,
          border: '1px solid #ddd',
        }}
      />

      <input
        value={password}
        placeholder="password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          marginBottom: 16,
          borderRadius: 8,
          border: '1px solid #ddd',
        }}
      />

      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: 'none',
          background: '#2563eb',
          color: 'white',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.75 : 1,
        }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {loading ? (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: '#6b7280' }}>
          If this takes longer than usual, the server is likely warming up. Please keep this page open.
        </p>
      ) : null}
    </div>
  );
}

export default function LoginPageWithSuspense() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
