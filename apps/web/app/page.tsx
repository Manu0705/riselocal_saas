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

type HomeHeaderProps = {
  loginHref: string;
  tenantLabel: string | null;
};

function HomeHeader({ loginHref, tenantLabel }: HomeHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-600 to-blue-800 shadow-md" />
          <div>
            <p className="m-0 text-base font-extrabold tracking-tight text-slate-900">RiseLocal</p>
            <p className="m-0 text-xs text-slate-500">Multi-Tenant Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {tenantLabel ? (
            <span className="hidden rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:inline-flex">
              Continue as {tenantLabel}
            </span>
          ) : null}

          <Link
            href="/about-us"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            About Us
          </Link>

          <Link
            href={loginHref}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}

type HomeHeroProps = {
  tenantLabel: string | null;
  loginHref: string;
};

function HomeHero({ tenantLabel, loginHref }: HomeHeroProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <div className="hero-fade-in relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-6 py-12 text-center shadow-[0_18px_50px_rgba(15,23,42,0.10)] sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-sky-300/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-indigo-300/40 blur-2xl" />

        <div className="relative z-10 mx-auto max-w-3xl">
          {tenantLabel ? (
            <p className="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
              Continue as {tenantLabel}
            </p>
          ) : null}

          <h1 className="m-0 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Welcome to RiseLocal
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-slate-600 sm:text-xl">
            Your Multi-Tenant SaaS Platform
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/about-us"
              className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(29,78,216,0.32)] transition duration-200 hover:scale-[1.03] hover:bg-blue-600"
            >
              About Us
            </Link>

            <Link
              href={loginHref}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(15,23,42,0.28)] transition duration-200 hover:scale-[1.03] hover:bg-slate-800"
            >
              {tenantLabel ? `Login to ${tenantLabel}` : 'Login'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeBody() {
  const features = [
    {
      icon: '🏬',
      title: 'Tenant-Aware Experience',
      description: 'Each business gets its own branded flow with clean tenant separation and a shared core platform.',
    },
    {
      icon: '📈',
      title: 'Live Lead Visibility',
      description: 'Track leads, updates, and follow-ups through a responsive dashboard built for day-to-day business speed.',
    },
    {
      icon: '🔒',
      title: 'Secure by Default',
      description: 'Authentication and access control stay robust while your teams focus on clients and conversions.',
    },
  ];

  const benefits = [
    'Onboard new tenants quickly with reusable flows',
    'Keep operations consistent across all customer spaces',
    'Scale from local teams to multi-branch organizations',
    'Deliver fast, modern SaaS UX on desktop and mobile',
  ];

  return (
    <>
      <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-2xl" aria-hidden>
                {feature.icon}
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Why teams choose RiseLocal</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  ✓
                </span>
                <p className="m-0 text-sm text-slate-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mb-12 mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 p-7 text-center text-white shadow-[0_18px_50px_rgba(15,23,42,0.28)] sm:p-10">
          <p className="m-0 text-sm uppercase tracking-[0.2em] text-slate-300">Built for modern tenant growth</p>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">Launch, scale, and run your SaaS with confidence</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            A clean multi-tenant foundation with premium UX so your users feel the quality from the first click.
          </p>
        </div>
      </section>
    </>
  );
}

type HomeFooterProps = {
  loginHref: string;
};

function HomeFooter({ loginHref }: HomeFooterProps) {
  return (
    <footer className="mt-auto border-t border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-slate-600 sm:flex-row sm:px-6 lg:px-8">
        <p className="m-0">RiseLocal</p>
        <div className="flex items-center gap-4">
          <Link href="/about-us" className="font-medium text-slate-700 transition hover:text-slate-900">
            About
          </Link>
          <Link href={loginHref} className="font-medium text-slate-700 transition hover:text-slate-900">
            Login
          </Link>
        </div>
        <p className="m-0">© {new Date().getFullYear()} RiseLocal. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const [tenantHint, setTenantHint] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const tenantFromQuery = params.get('tenant');
    const normalized = (tenantFromQuery ?? '').trim().toLowerCase();
    if (normalized) {
      setTenantHint(normalized);
      try {
        localStorage.setItem(LAST_TENANT_KEY, normalized);
      } catch {
        // Ignore transient storage failures on restored tabs/private browsing.
      }
      return;
    }

    let fromStorage: string | null = null;
    try {
      fromStorage = localStorage.getItem(LAST_TENANT_KEY);
    } catch {
      fromStorage = null;
    }
    setTenantHint(fromStorage && fromStorage.trim().length > 0 ? fromStorage.trim().toLowerCase() : null);
  }, []);

  const loginHref = useMemo(() => {
    if (!tenantHint) return '/login';
    return `/login?tenant=${encodeURIComponent(tenantHint)}`;
  }, [tenantHint]);

  const tenantLabel = tenantHint ? toTenantLabel(tenantHint) : null;

  return (
    <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_42%,#e2e8f0_100%)]">
      <HomeHeader loginHref={loginHref} tenantLabel={tenantLabel} />
      <main className="w-full">
        <HomeHero tenantLabel={tenantLabel} loginHref={loginHref} />
        <HomeBody />
      </main>
      <HomeFooter loginHref={loginHref} />

      <style jsx>{`
        .hero-fade-in {
          animation: heroFadeIn 700ms ease-out;
        }

        @keyframes heroFadeIn {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
