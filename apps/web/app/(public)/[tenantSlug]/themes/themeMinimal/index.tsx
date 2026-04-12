"use client";

import Image from 'next/image';
import type { ResolvedTenant } from "@/lib/tenant-resolver";
import BookingForm from "./booking-form";
import Services from "../../components/services";
import Gallery from "../../components/gallery";
import QuickActions from "../../components/quick-actions";
import HowItWorks from "../../components/how-it-works";

type Props = {
  tenant: ResolvedTenant;
  tenantSlug: string;
};

const OPEN_HOUR = 9;
const CLOSE_HOUR = 21;

// 🔥 UTIL FUNCTIONS
const formatHour = (hour: number) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const formatted = hour % 12 === 0 ? 12 : hour % 12;
  return `${formatted}:00 ${suffix}`;
};

const getStatus = (openHour: number, closeHour: number) => {
  const now = new Date();
  const hours = now.getHours();

  const isOpen = hours >= openHour && hours < closeHour;

  return {
    isOpen,
    text: isOpen
      ? `OPEN NOW • Closes at ${formatHour(closeHour)}`
      : `CLOSED • Opens at ${formatHour(openHour)}`,
  };
};

export default function ThemeMinimal({ tenant, tenantSlug }: Readonly<Props>) {
  const openHour = Math.max(
    OPEN_HOUR,
    Math.min(typeof tenant.openHour === 'number' ? tenant.openHour : OPEN_HOUR, CLOSE_HOUR),
  );
  const closeHour = Math.max(
    openHour,
    Math.min(typeof tenant.closeHour === 'number' ? tenant.closeHour : CLOSE_HOUR, CLOSE_HOUR),
  );
  const availableHours = Array.isArray(tenant.availableHours) ? tenant.availableHours : undefined;
  const { isOpen, text } = getStatus(openHour, closeHour);

  // 🔥 STATE

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,241,236,0.92),_transparent_45%),linear-gradient(180deg,#fff8f4_0%,#fdf0ea_100%)] py-6 pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_32px_120px_rgba(238,149,123,0.16)] backdrop-blur-xl mb-10">
          {tenant.bannerUrl ? (
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <Image
                src={tenant.bannerUrl}
                alt={`${tenant.name || 'Banner image'}`}
                fill
                sizes="100vw"
                className="object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/40 to-white/95" />
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,207,193,0.5),_transparent_36%)]" />
          <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="relative z-10 p-6 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-5">
                {/* <p className="inline-flex items-center gap-2 rounded-full bg-rose-100/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-rose-700 shadow-sm">
                  PREMIUM BEAUTY
                </p> */}
                <div className="mb-8 rounded-[2rem] border border-rose-100/70 bg-rose-50/80 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {tenant.logoUrl ? (
                        <Image
                          src={tenant.logoUrl}
                          alt={`${tenant.name || 'Business'} logo`}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-base font-semibold text-rose-700">
                          {tenant.name?.charAt(0) ?? 'B'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.32em] text-rose-600">Premium salon</p>
                        <p className="text-lg font-semibold text-slate-900 truncate">{tenant.name || 'Your Beauty Studio'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  {/* Experience Beauty & Care Like Never Before */}
                  {tenant.tagline || 'Book luxe salon, spa and beauty services with premium styling, expert care, and a serene atmosphere.'}
                </h1>
                {/* <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  {tenant.tagline || 'Book luxe salon, spa and beauty services with premium styling, expert care, and a serene atmosphere.'}
                </p> */}
                <a
                  href="#booking-form"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-rose-200 px-8 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-rose-200/50 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                >
                  Book Appointment
                </a>
              </div>

              <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_72px_rgba(238,149,123,0.18)] backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-rose-600">Reviews</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">★★★★★</p>
                  </div>
                  <div className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                    1.2K Reviews
                  </div>
                </div>
                      <div className="mt-6 rounded-[1.5rem] bg-rose-50/90 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">Open Today</p>
                  <p className="mt-1 text-sm text-slate-600">{formatHour(openHour)} — {formatHour(closeHour)}</p>
                  <p className="mt-2 text-sm text-slate-600">{text}</p>
                </div>
                <div className="mt-6">
                  <QuickActions
                    phone={tenant.whatsapp || tenant.phone}
                    tenantId={tenant.id}
                    tenantSlug={tenantSlug}
                    actionButtons={tenant.actionButtons}
                    whatsappLabel="Chat on WhatsApp"
                    callLabel="Call Now"
                    whatsappMessage={`Hi, I’m interested in premium services from ${tenant.name || 'your salon'}. Please assist me.`}
                    variant="premium"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🔥 AVAILABILITY */}
        <div className="p-6 mb-10 rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_24px_72px_rgba(243,147,126,0.14)]">
          <h3 className="font-semibold text-slate-800 mb-4 text-lg">
            Real-Time Availability
          </h3>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: closeHour - openHour + 1 }).map((_, i) => {
              const hour = openHour + i;
              const label = formatHour(hour);
              const isAvailable = Array.isArray(availableHours)
                ? availableHours.includes(hour)
                : hour % 2 === 0;

              return (
                <div
                  key={hour}
                  className={`min-w-[105px] rounded-[1.5rem] border px-3 py-3 text-center text-xs font-semibold flex-shrink-0 transition duration-300 ${
                    isAvailable
                      ? "bg-rose-50 text-rose-700 border-rose-100 shadow-sm"
                      : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}
                >
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.15em]">
                    {isAvailable ? "Available" : "Busy"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-10">
          <BookingForm tenant={tenant} tenantSlug={tenantSlug} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-10">
          <Services services={tenant.services || []} />
          <Gallery {...tenant} tenantSlug={tenantSlug} />
        </div>

        {/* 🔥 HOW IT WORKS */}
        <div className="p-6 rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_rgba(234,129,117,0.1)] mb-10">
          <HowItWorks
            title="How booking works"
            steps={[
              { title: "Browse services", desc: "Explore offerings" },
              { title: "Check availability", desc: "Find open slots" },
              { title: "Book instantly", desc: "Confirm your slot" },
            ]}
          />
        </div>

      </div>

      {/* 🔥 MOBILE CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/80 bg-white/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ready to book?</p>
            <p className="font-semibold text-slate-900">Premium appointment in one tap</p>
          </div>
          <a
            href="#booking-form"
            className="rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-rose-200 px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl transition duration-300 hover:-translate-y-0.5"
          >
            Book Now
          </a>
        </div>
      </div>
    </div>
  );
}