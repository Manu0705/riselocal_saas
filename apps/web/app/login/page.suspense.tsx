'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { fetchWithRetry } from '@/lib/retry';

export const dynamic = 'force-dynamic';
const LAST_TENANT_KEY = 'riselocal:last-tenant';

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

function Spinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'rl-spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Tenant can come from ?tenant=<slug> (root domain) OR be detected from
  // the subdomain hostname client-side. Both paths produce the same rendered
  // output on SSR (null) so hydration never mismatches.
  const [tenant, setTenant] = useState<string | null>(
    () => searchParams.get('tenant')?.trim().toLowerCase() || null
  );

  const { login: loginWithContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Detect tenant from subdomain hostname when no ?tenant param is present.
  useEffect(() => {
    if (!tenant && typeof window !== 'undefined') {
      const parts = window.location.hostname.split('.');
      // hostname like "jai-bhavani-interiors.riselocal.in" → 3+ parts
      if (parts.length >= 3 && parts[0] !== 'www') {
        setTenant(parts[0].toLowerCase());
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tenant) {
      localStorage.setItem(LAST_TENANT_KEY, tenant);
    }
  }, [tenant]);

  useEffect(() => {
    void fetchWithRetry('/api/health', { cache: 'no-store' }, {
      attempts: 5,
      initialDelayMs: 1200,
      maxDelayMs: 8000,
      factor: 1.5,
    }).catch(() => {
      // Silent warm-up; login submit has its own retry path.
    });
  }, []);

  const backToHomeHref = tenant ? `/?tenant=${encodeURIComponent(tenant)}` : '/';

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    try {
      const data = await login(email.trim(), password, tenant ?? undefined);

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
      loginWithContext(data.token, tenant ?? tenantSlugFromServer, userNameFromServer, data?.user?.role);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes rl-spin { to { transform: rotate(360deg); } }
        .rl-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid var(--card-border);
          border-radius: 10px;
          background: var(--bg);
          color: var(--text);
          font-size: 15px;
          outline: none;
          transition: border-color 140ms ease, box-shadow 140ms ease;
          font-family: inherit;
        }
        .rl-input::placeholder { color: var(--muted); }
        .rl-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .rl-btn-primary {
          width: 100%;
          padding: 13px 16px;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 140ms ease, background 140ms ease;
          font-family: inherit;
        }
        .rl-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
        .rl-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
        .rl-eye-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--muted);
          padding: 4px; display: flex; align-items: center;
        }
        .rl-eye-btn:hover { color: var(--text); }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          background: 'var(--bg)',
        }}
      >
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#2563eb',
              marginBottom: 16,
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: 'clamp(22px, 5vw, 28px)',
              fontWeight: 800,
              color: 'var(--text)',
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            {tenant ? (
              <>Welcome back</>
            ) : (
              <>RiseLocal</>
            )}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--muted)' }}>
            {tenant
              ? `Sign in to manage your dashboard`
              : 'Sign in to your tenant dashboard'}
          </p>
          {tenant && (
            <span
              style={{
                display: 'inline-block',
                marginTop: 8,
                padding: '3px 10px',
                background: '#eff6ff',
                color: '#2563eb',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid #bfdbfe',
              }}
            >
              {tenant}
            </span>
          )}
        </div>

        {/* Login card */}
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'var(--card)',
            border: '1px solid var(--card-border)',
            borderRadius: 16,
            padding: 'clamp(20px, 5vw, 32px)',
            boxShadow: '0 4px 24px var(--shadow)',
          }}
        >
          {/* Error banner */}
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: '11px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                color: '#dc2626',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Sign in failed</div>
              {error}
              {isLikelyColdStartIssue(error) && (
                <div style={{ marginTop: 6, color: '#991b1b', fontSize: 12 }}>
                  The server may be waking up. Wait 20–60 s and try again.
                </div>
              )}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                Email address
              </label>
              <input
                className="rl-input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="rl-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  className="rl-eye-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="rl-btn-primary"
              disabled={loading || !email.trim() || !password}
            >
              {loading ? (
                <>
                  <Spinner />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>

            {loading && (
              <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
                First login may take 20–60 s while the server wakes up.
              </p>
            )}
          </form>
        </div>

        {/* Footer link back to home */}
        <p style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
          <a href={backToHomeHref} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to home
          </a>
        </p>
      </div>
    </>
  );
}

export default function LoginPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted)',
            fontSize: 14,
          }}
        >
          Loading…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
