'use client';

import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Image from 'next/image';
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

type BrandMarkProps = {
  compact?: boolean;
  subtitle?: string;
};

function BrandMark({ compact = false, subtitle = 'Multi-Tenant Platform' }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-[20px] border border-white/80 bg-white/80 p-1 shadow-[0_10px_30px_rgba(8,28,77,0.12)] backdrop-blur">
        <Image
          src="/logo/JB_Logo.jpeg"
          alt="RiseLocal logo"
          width={compact ? 40 : 48}
          height={compact ? 40 : 48}
          className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-2xl object-contain`}
        />
      </div>
      <div>
        <p className={`${compact ? 'text-base' : 'text-lg'} m-0 font-black tracking-tight text-slate-950`}>RiseLocal</p>
        <p className="m-0 text-xs font-medium text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-[#1d72f3]">{eyebrow}</p>
      <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
    </div>
  );
}

type HomeHeaderProps = {
  loginHref: string;
  tenantLabel: string | null;
};

function HomeHeader({ loginHref, tenantLabel }: HomeHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <BrandMark compact />

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {tenantLabel ? (
            <span className="hidden rounded-full border border-[#1d72f3]/20 bg-[#1d72f3]/10 px-3 py-1 text-xs font-semibold text-[#0f3c97] sm:inline-flex">
              Continue as {tenantLabel}
            </span>
          ) : null}

          <Link
            href="/about-us"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            About Us
          </Link>

          <Link
            href={loginHref}
            className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1d72f3_0%,#0f255f_100%)] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,37,95,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,37,95,0.28)]"
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

type HeroPreviewProps = {
  tenantLabel: string | null;
};

function HeroPreview({ tenantLabel }: HeroPreviewProps) {
  const workspaceLabel = tenantLabel ?? 'Default Workspace';

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="pulse-ring absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(29,114,243,0.22),transparent_58%)] blur-2xl" />

      <div className="float-card relative overflow-hidden rounded-[28px] border border-white/10 bg-[#06163d] p-4 text-white shadow-[0_30px_70px_rgba(6,22,61,0.42)] sm:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(29,114,243,0.35),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(43,180,74,0.22),transparent_24%)]" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-100/75">Growth overview</p>
              <h3 className="mt-2 text-lg font-bold">Tenant command center</h3>
            </div>
            <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
              Live
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Leads', value: '128', tone: 'text-sky-100' },
              { label: 'Conversion', value: '18%', tone: 'text-emerald-100' },
              { label: 'Tenants', value: '24', tone: 'text-violet-100' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                <p className="text-[11px] text-slate-300">{item.label}</p>
                <p className={`mt-1 text-lg font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-300">Saved workspace</p>
                <p className="text-sm font-semibold text-white">{workspaceLabel}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-sky-200" />
            </div>

            <div className="mt-4 flex h-28 items-end gap-2">
              {[
                'h-[34%]',
                'h-[52%]',
                'h-[46%]',
                'h-[72%]',
                'h-[58%]',
                'h-[80%]',
                'h-[96%]',
              ].map((heightClass, index) => (
                <div
                  key={`${heightClass}-${index}`}
                  className={`w-full rounded-t-2xl ${heightClass} ${index === 6 ? 'bg-[#2bb44a]' : 'bg-gradient-to-t from-[#1d72f3] to-sky-300'}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-300">Response health</p>
                <p className="text-sm font-semibold text-white">Fast, branded, and tenant-safe</p>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-sky-100">+24%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 left-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_16px_40px_rgba(8,28,77,0.18)] backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">WhatsApp leads</p>
        <p className="mt-1 text-sm font-bold text-slate-900">Up 24% this week</p>
      </div>
    </div>
  );
}

function HomeHero({ tenantLabel, loginHref }: HomeHeroProps) {
  const primaryLabel = tenantLabel ? `Continue to ${tenantLabel}` : 'Login to Dashboard';

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <div className="hero-fade-in relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,247,255,0.96))] px-5 py-5 shadow-[0_28px_90px_rgba(8,28,77,0.12)] sm:px-7 sm:py-7 lg:px-8 lg:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,114,243,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(43,180,74,0.16),transparent_28%)]" />
        <div className="pointer-events-none absolute -left-16 top-12 h-40 w-40 rounded-full bg-[#2bb44a]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 -top-8 h-44 w-44 rounded-full bg-[#1d72f3]/20 blur-3xl" />

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1d72f3]/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#0f3c97] shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Premium multi-tenant growth platform
            </div>

            {tenantLabel ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700">
                <BadgeCheck className="h-4 w-4" />
                Continue as {tenantLabel}
              </p>
            ) : null}

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Grow Your Business with RiseLocal
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              All-in-one multi-tenant SaaS platform for modern businesses.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={loginHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#1d72f3_0%,#0f255f_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(15,37,95,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(15,37,95,0.32)]"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/about-us"
                className="rounded-2xl border border-slate-200 bg-white/85 px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                About Us
              </Link>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Branded tenant flows', value: '24/7' },
                { label: 'Faster follow-ups', value: '+32%' },
                { label: 'Unified operations', value: '1 hub' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-sm backdrop-blur">
                  <p className="text-lg font-black text-slate-950">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <HeroPreview tenantLabel={tenantLabel} />
        </div>
      </div>
    </section>
  );
}

type HomeBodyProps = {
  loginHref: string;
  tenantLabel: string | null;
};

function HomeBody({ loginHref, tenantLabel }: HomeBodyProps) {
  const features = [
    {
      icon: Building2,
      title: 'Tenant-aware branding',
      description: 'Deliver polished, branded experiences for every tenant while keeping one shared platform underneath.',
    },
    {
      icon: LayoutDashboard,
      title: 'Live pipeline visibility',
      description: 'Track leads, follow-ups, and activity in one clean dashboard built for fast daily execution.',
    },
    {
      icon: Users,
      title: 'Aligned team workflows',
      description: 'Help operators and teams stay coordinated across locations, tenants, and conversion stages.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure by default',
      description: 'Protect data and access with strong tenant boundaries and a production-ready SaaS foundation.',
    },
  ];

  const benefits = [
    'Onboard new tenants quickly with reusable flows',
    'Keep operations consistent across every customer space',
    'Give teams a cleaner, faster experience on desktop and mobile',
    'Scale from local operators to multi-branch organizations with confidence',
  ];

  const ctaLabel = tenantLabel ? `Continue to ${tenantLabel}` : 'Login Now';

  return (
    <>
      <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything your team needs to look polished and move faster"
          description="Inspired by modern SaaS products, RiseLocal now feels cleaner, sharper, and more production-ready without changing your underlying flow."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group rounded-[24px] border border-slate-200/80 bg-white/85 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur transition duration-200 hover:-translate-y-1.5 hover:border-[#1d72f3]/20 hover:shadow-[0_18px_40px_rgba(15,37,95,0.12)]"
              >
                <div className="inline-flex rounded-2xl bg-[linear-gradient(135deg,rgba(29,114,243,0.14),rgba(43,180,74,0.14))] p-3 text-[#0f3c97] transition duration-200 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
            <SectionHeading
              eyebrow="Benefits"
              title="Why teams choose RiseLocal"
              description="Minimal friction, better clarity, and a stronger first impression for every tenant journey."
            />

            <div className="mt-5 grid gap-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 rounded-2xl bg-slate-50/90 p-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d72f3_0%,#2bb44a_100%)] text-white shadow-sm">
                    <BadgeCheck className="h-3.5 w-3.5" />
                  </span>
                  <p className="m-0 text-sm leading-6 text-slate-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-[linear-gradient(135deg,#0a183d_0%,#123a84_58%,#1d72f3_100%)] p-6 text-white shadow-[0_20px_50px_rgba(15,37,95,0.26)] sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-100/80">Premium UX</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight">Built to feel like a real SaaS product from the first click</h3>
            <p className="mt-3 text-sm leading-6 text-sky-50/85 sm:text-base">
              The refreshed interface uses your logo palette — electric blue, deep navy, and fresh green — for stronger brand consistency and a cleaner, more modern feel.
            </p>

            <div className="mt-5 space-y-3">
              {[
                'Logo-aligned buttons, gradients, and highlights',
                'Modern glassmorphism surfaces with depth and spacing',
                'Responsive layouts that stay clean on mobile and desktop',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-sky-50 backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-12 mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[30px] bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,114,243,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(43,180,74,0.22),transparent_28%)]" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-200">Ready to grow</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                Launch, scale, and run your SaaS with confidence
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                A clean multi-tenant foundation with premium UI polish so users feel the quality immediately.
              </p>
              {tenantLabel ? (
                <p className="mt-3 inline-flex rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                  Saved workspace: {tenantLabel}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={loginHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition duration-200 hover:-translate-y-0.5"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about-us"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/15"
              >
                About Us
              </Link>
            </div>
          </div>
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
    <footer className="mt-auto border-t border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-5 text-sm text-slate-600 sm:flex-row sm:px-6 lg:px-8">
        <BrandMark compact subtitle="Premium multi-tenant SaaS" />

        <div className="flex items-center gap-4">
          <Link href="/about-us" className="font-medium text-slate-700 transition hover:text-slate-950">
            About
          </Link>
          <Link href={loginHref} className="font-medium text-slate-700 transition hover:text-slate-950">
            Login
          </Link>
        </div>

        <p className="m-0 text-center">© {new Date().getFullYear()} RiseLocal. All rights reserved.</p>
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(29,114,243,0.12),transparent_0,transparent_36%),radial-gradient(circle_at_bottom_right,rgba(43,180,74,0.10),transparent_0,transparent_30%),linear-gradient(180deg,#f7fbff_0%,#eef5ff_48%,#f8fafc_100%)]">
      <HomeHeader loginHref={loginHref} tenantLabel={tenantLabel} />
      <main className="w-full">
        <HomeHero tenantLabel={tenantLabel} loginHref={loginHref} />
        <HomeBody loginHref={loginHref} tenantLabel={tenantLabel} />
      </main>
      <HomeFooter loginHref={loginHref} />

      <style jsx>{`
        .hero-fade-in {
          animation: heroFadeIn 700ms ease-out;
        }

        .float-card {
          animation: floatY 6s ease-in-out infinite;
        }

        .pulse-ring {
          animation: pulseGlow 5s ease-in-out infinite;
        }

        @keyframes heroFadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes floatY {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            opacity: 0.75;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
