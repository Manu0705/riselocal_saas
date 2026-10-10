'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Menu,
  ShieldCheck,
  Utensils,
  Wifi,
  X,
} from 'lucide-react';

import type { ResolvedTenant } from '@/lib/tenant-resolver';

import QuickActions from '../../components/quick-actions';
import Booking from '../../components/booking';
import Contact from '../../components/contact';
import StudentAccountMenu from '../../components/student-account-menu';

import PublicRooms from './public-rooms';
import HostelServices from './hostel-services';
import HostelGallery from './hostel-gallery';

type Props = {
  tenant: ResolvedTenant;
  tenantSlug: string;
};

const HOSTEL_GREEN = '#1F6B48';
const HOSTEL_GREEN_DARK = '#15563A';
const HOSTEL_GOLD = '#C18B27';
const HOSTEL_GOLD_DARK = '#B27A17';

const BACKGROUND = '#FBFAF7';
const WHITE = '#FFFFFF';
const TEXT = '#102033';
const MUTED = '#536579';
const BORDER = '#E7E2D8';
const LIGHT_GREEN = '#E8F3EC';
const LIGHT_GOLD = '#FFF1D2';

function getThemeColor(
  value: string | undefined,
  fallback: string,
) {
  const normalized = value?.trim().toUpperCase();

  /*
   * The current tenant can contain #000000 / #FFFFFF from the
   * database. Those values are valid tenant colors but are not
   * suitable for the Hostel reference design.
   *
   * Keep legitimate custom colors, but fall back to the Hostel
   * palette for black/white placeholder values.
   */
  if (
    !normalized ||
    normalized === '#000000' ||
    normalized === '#FFFFFF' ||
    normalized === '#FFF'
  ) {
    return fallback;
  }

  return value as string;
}

export default function ThemeHostel({
  tenant,
  tenantSlug,
}: Readonly<Props>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /*
   * Preserve tenant customization when meaningful colors exist,
   * while preventing placeholder black/white values from breaking
   * the Hostel visual system.
   */
  const primaryColor = getThemeColor(
    tenant.primaryColor,
    HOSTEL_GREEN,
  );

  const secondaryColor = getThemeColor(
    tenant.secondaryColor,
    HOSTEL_GOLD,
  );

  const tenantName = tenant.name || 'Skyline Hostel';

  const tagline =
    tenant.tagline ||
    'A safe, comfortable and welcoming home for students to live, study and grow.';

  const services = Array.isArray(tenant.services)
    ? tenant.services
    : [];

  const gallery = Array.isArray(tenant.gallery)
    ? tenant.gallery
    : [];

  const phone = tenant.phone || tenant.whatsapp || '';

  const whatsapp = tenant.whatsapp || tenant.phone || '';

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const scrollToSection = (id: string) => {
    closeMobileMenu();

    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 40);
  };

  const whatsappMessage = `Hi, I am interested in ${tenantName}. Please share accommodation details and availability.`;

  const whatsappHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        whatsappMessage,
      )}`
    : '#enquire';

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: BACKGROUND,
        color: TEXT,
      }}
    >
      {/* ============================================================
          HEADER
      ============================================================ */}
      <header className="sticky top-0 z-50 border-b border-[#E7E2D8]/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* Brand */}
          <button
            type="button"
            onClick={() => scrollToSection('hero')}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            {tenant.logoUrl ? (
              <div className="relative h-11 w-11 shrink-0 overflow-hidden bg-white">
                <Image
                  src={tenant.logoUrl}
                  alt={`${tenantName} logo`}
                  fill
                  sizes="44px"
                  className="object-contain"
                />
              </div>
            ) : (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <BedDouble size={22} />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-[17px] font-black tracking-tight text-[#102033]">
                {tenantName}
              </p>

              <p className="text-[11px] font-medium tracking-wide text-[#536579]">
                Live • Learn • Grow
              </p>
            </div>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 lg:flex">
            {[
              ['Home', 'hero'],
              ['Rooms', 'rooms'],
              ['Amenities', 'amenities'],
              ['Gallery', 'gallery'],
              ['Contact', 'enquire'],
            ].map(([label, id]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className={`relative py-2 text-xs font-semibold transition-colors ${
                  id === 'hero'
                    ? 'text-[#102033]'
                    : 'text-[#536579] hover:text-[#102033]'
                }`}
              >
                {label}

                {id === 'hero' ? (
                  <span
                    className="absolute bottom-0 left-0 h-0.5 w-full rounded-full"
                    style={{ backgroundColor: secondaryColor }}
                  />
                ) : null}
              </button>
            ))}
          </nav>

          {/* Desktop student account + WhatsApp */}
          <div className="hidden items-center gap-3 lg:flex">
            <StudentAccountMenu tenantSlug={tenantSlug} />

            <a
              href={whatsappHref}
            target={whatsapp ? '_blank' : undefined}
            rel={whatsapp ? 'noopener noreferrer' : undefined}
            onClick={() => {
              if (!whatsapp) {
                scrollToSection('enquire');
              }
            }}
            className="hidden items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md lg:inline-flex"
            style={{ backgroundColor: secondaryColor }}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-[11px]">
                W
              </span>

              Enquire on WhatsApp
            </a>
          </div>

          {/* Mobile menu */}
          <button
            type="button"
            aria-label={
              mobileMenuOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
            onClick={() =>
              setMobileMenuOpen((current) => !current)
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#102033] lg:hidden"
          >
            {mobileMenuOpen ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen ? (
          <div className="border-t border-[#E7E2D8] bg-white lg:hidden">
            <div className="mx-auto max-w-[1400px] px-5 py-3 sm:px-8">
              {[
                ['Home', 'hero'],
                ['Rooms', 'rooms'],
                ['Amenities', 'amenities'],
                ['Gallery', 'gallery'],
                ['Contact', 'enquire'],
              ].map(([label, id]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="flex w-full items-center justify-between border-b border-[#E7E2D8] py-4 text-left text-sm font-semibold text-[#102033]"
                >
                  {label}
                  <ArrowRight size={16} />
                </button>
              ))}

              <div className="mt-3">
                <StudentAccountMenu
                  tenantSlug={tenantSlug}
                  className="w-full"
                />
              </div>

              <a
                href={whatsappHref}
                target={whatsapp ? '_blank' : undefined}
                rel={
                  whatsapp
                    ? 'noopener noreferrer'
                    : undefined
                }
                onClick={() => {
                  if (!whatsapp) {
                    scrollToSection('enquire');
                  }
                }}
                className="mt-4 flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-white"
                style={{ backgroundColor: secondaryColor }}
              >
                Enquire on WhatsApp
              </a>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        {/* ============================================================
            HERO
        ============================================================ */}
        <section
          id="hero"
          className="scroll-mt-20 overflow-hidden bg-white"
        >
          <div className="mx-auto grid min-h-[520px] w-full max-w-[1400px] lg:grid-cols-[1fr_1fr]">
            {/* Hero left */}
            <div className="relative z-10 flex items-center px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
              <div className="w-full max-w-[650px]">
                {/* Eyebrow */}
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{
                    backgroundColor: '#F7EEDC',
                    color: '#7B5A1B',
                  }}
                >
                  <BedDouble size={14} />
                  Student Accommodation
                </div>

                {/* Heading */}
                <h1 className="mt-6 font-serif text-[44px] font-bold leading-[0.98] tracking-[-0.045em] text-[#102033] sm:text-[54px] lg:text-[62px]">
                  More Than a Stay
                  <span
                    className="mt-2 block"
                    style={{ color: secondaryColor }}
                  >
                    A Better Tomorrow
                  </span>
                </h1>

                {/* Description */}
                <p className="mt-6 max-w-[560px] text-base leading-7 text-[#536579] sm:text-lg sm:leading-8">
                  {tagline}
                </p>

                {/* Existing action component */}
                <div className="mt-7">
                  <QuickActions
                    phone={phone}
                    tenantId={tenant.id || ''}
                    tenantSlug={tenantSlug}
                    actionButtons={tenant.actionButtons}
                    whatsappLabel="Enquire Now"
                    callLabel="Call Hostel"
                    whatsappMessage={whatsappMessage}
                  />
                </div>

                {/* Feature row */}
                <div className="mt-9 grid grid-cols-2 border-t border-[#E7E2D8] pt-6 sm:grid-cols-4">
                  {[
                    {
                      icon: ShieldCheck,
                      label: 'Safe & Secure',
                    },
                    {
                      icon: BedDouble,
                      label: 'Student Friendly',
                    },
                    {
                      icon: Wifi,
                      label: 'High Speed Wi-Fi',
                    },
                    {
                      icon: Utensils,
                      label: 'Healthy Food',
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className={`flex flex-col items-center gap-2 px-3 text-center ${
                          index > 0
                            ? 'border-l border-[#E7E2D8]'
                            : ''
                        }`}
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: LIGHT_GREEN,
                            color: primaryColor,
                          }}
                        >
                          <Icon size={19} />
                        </div>

                        <span className="text-[11px] font-medium leading-4 text-[#536579]">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative min-h-[360px] lg:min-h-[520px]">
              <Image
                src={
                  tenant.bannerUrl ||
                  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1400&q=85&auto=format&fit=crop'
                }
                alt={`${tenantName} accommodation`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />

              {/* Soft left fade matching screenshot */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.35) 17%, rgba(255,255,255,0) 43%)',
                }}
              />

             {/* <div className="absolute bottom-8 right-6 hidden h-[155px] w-[135px] sm:block"> */}
             <div className="absolute bottom-8 right-6 block h-[155px] w-[135px]">
             {/* <div className="absolute bottom-4 right-2 z-30 block h-[155px] w-[135px] sm:bottom-6 sm:right-6"> */}
  {/* Green leafy background */}
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 0 145 155"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    <path
      d="M0 72
         C0 45 22 25 48 22
         C78 18 103 8 145 0
         L145 100
         C145 125 126 143 102 149
         C72 156 35 155 0 155
         Z"
      fill="#15563A"
    />
  </svg>

  {/* Content */}
  <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 pb-3 text-center text-white">
    <p className="font-serif text-[13px] leading-5">
      A Home
      <br />
      for Better
      <br />
      You
    </p>

    {/* Leaf icon */}
   <span className="mt-1 block text-sm">
                  ◆
                </span>
  </div>
</div>

              {/* <div className="absolute bottom-6 right-6 hidden w-[130px] rounded-[34px] rounded-br-[55px] rounded-tl-[55px] border border-white/30 bg-[#15563A]/95 px-5 py-6 text-center text-white shadow-xl sm:block">
                <p className="text-[13px] font-serif leading-5">
                  A Home
                  <br />
                  for Better
                  <br />
                  You
                </p>

                <span className="mt-1 block text-sm">
                  ◆
                </span>
              </div> */}

              {/* Hero image indicators */}
              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 lg:left-auto lg:right-8 lg:translate-x-0">
                {[0, 1, 2, 3].map((item) => (
                  <span
                    key={item}
                    className={`h-2.5 w-2.5 rounded-full ${
                      item === 0
                        ? 'bg-[#C18B27]'
                        : 'bg-white/85'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            ROOMS
        ============================================================ */}
        <section
          id="rooms"
          className="scroll-mt-24 py-3 sm:py-5"
        >
          <PublicRooms
            tenantSlug={tenantSlug}
            primaryColor={primaryColor}
          />
        </section>

        {/* ============================================================
            AMENITIES STRIP
        ============================================================ */}
        <section
          id="amenities"
          className="scroll-mt-24 py-2 sm:py-4"
        >
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-7 rounded-[24px] border border-[#E7E2D8] bg-white px-5 py-6 shadow-sm sm:px-8 lg:flex-row lg:items-center lg:px-10">
            <div className="shrink-0 lg:w-[310px]">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.24em]"
                style={{ color: secondaryColor }}
              >
                Amenities
              </p>

              <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#102033] sm:text-3xl">
                Everything You Need
              </h2>

              <p className="mt-2 text-xs leading-5 text-[#536579]">
                Modern facilities for a comfortable and
                convenient stay.
              </p>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {[
                [Wifi, 'Wi-Fi'],
                [Utensils, 'Nutritious Food'],
                [ShieldCheck, '24/7 Security'],
                [CheckCircle2, 'Laundry'],
                [BedDouble, 'Housekeeping'],
                [MapPinIcon, 'Easy Transport'],
              ].map(([Icon, label]) => {
                const AmenityIcon =
                  Icon as typeof Wifi;

                return (
                  <div
                    key={String(label)}
                    className="flex flex-col items-center text-center"
                  >
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: LIGHT_GREEN,
                        color: primaryColor,
                      }}
                    >
                      <AmenityIcon size={23} />
                    </div>

                    <p className="mt-2 text-[11px] font-medium text-[#536579]">
                      {String(label)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================
            GALLERY + WHY CHOOSE US
        ============================================================ */}
        <section className="py-3 sm:py-5">
          <div className="mx-auto grid w-full max-w-[1400px] gap-4 lg:grid-cols-[0.82fr_1.18fr]">
            {/* Gallery */}
            <div id="gallery" className="scroll-mt-24">
              <HostelGallery
                images={gallery}
                galleryCategories={
                  tenant.galleryCategories || []
                }
                tenantSlug={tenantSlug}
                tenantId={tenant.id || ''}
                phone={phone}
                actionButtons={tenant.actionButtons}
              />
            </div>

            {/* Why choose us */}
            <section className="rounded-[24px] border border-[#E7E2D8] bg-white p-6 shadow-sm sm:p-8">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.24em]"
                style={{ color: secondaryColor }}
              >
                Why Choose Us
              </p>

              <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#102033] sm:text-4xl">
                A Place to Belong
              </h2>

              <div className="mt-8 grid grid-cols-2 gap-0 sm:grid-cols-4">
                {[
                  {
                    icon: BedDouble,
                    title: 'Student Focused',
                    description:
                      'Designed for your comfort and growth.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Safe & Secure',
                    description:
                      'A secure environment with peace of mind.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Friendly Community',
                    description:
                      'Meet, connect and grow together.',
                  },
                  {
                    icon: Wifi,
                    title: 'Clean & Hygienic',
                    description:
                      'Well-maintained spaces every day.',
                  },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className={`px-4 py-2 text-center ${
                        index % 2 !== 0
                          ? 'border-l border-[#E7E2D8] sm:border-l'
                          : ''
                      } ${
                        index >= 2
                          ? 'border-t border-[#E7E2D8] sm:border-t-0'
                          : ''
                      } ${
                        index === 1
                          ? 'sm:border-l'
                          : ''
                      } ${
                        index === 2
                          ? 'sm:border-l'
                          : ''
                      }`}
                    >
                      <div
                        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: LIGHT_GREEN,
                          color: primaryColor,
                        }}
                      >
                        <Icon size={21} />
                      </div>

                      <h3 className="mt-4 text-xs font-bold leading-5 text-[#102033] sm:text-sm">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-[11px] leading-5 text-[#536579]">
                        {item.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </section>

        {/* ============================================================
            SERVICES
        ============================================================ */}
        <section className="py-3 sm:py-5">
          <div className="mx-auto w-full max-w-[1400px]">
            <HostelServices services={services} />
          </div>
        </section>

        {/* ============================================================
            CONTACT / ENQUIRY
        ============================================================ */}
        <section
          id="enquire"
          className="scroll-mt-24 py-3 sm:py-5"
        >
          <div className="mx-auto w-full max-w-[1400px]">
            <div className="relative overflow-hidden rounded-[24px] bg-[#B98A32]">
              {/* Decorative image */}
              <div className="absolute inset-y-0 left-0 hidden w-[32%] sm:block">
                {tenant.bannerUrl ? (
                  <Image
                    src={tenant.bannerUrl}
                    alt=""
                    fill
                    sizes="32vw"
                    className="object-cover opacity-70"
                  />
                ) : null}

                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#B98A32]" />
              </div>

              <div className="relative grid gap-7 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12 lg:py-10">
                <div className="lg:pl-[27%]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/85">
                    Have Questions?
                  </p>

                  <h2 className="mt-2 font-serif text-3xl font-bold text-white sm:text-4xl">
                    Get in Touch Today
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                    We&apos;re here to help you with room details,
                    availability, fees and more.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
                  {/* Existing connected WhatsApp action */}
                  <div className="min-w-[230px]">
                    <QuickActions
                      phone={phone}
                      tenantId={tenant.id || ''}
                      tenantSlug={tenantSlug}
                      actionButtons={tenant.actionButtons}
                      whatsappLabel="Enquire on WhatsApp"
                      callLabel="Call Us"
                      whatsappMessage={whatsappMessage}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Existing backend-connected enquiry/contact functionality.
              Kept below the visual CTA so existing functionality is
              not removed even though it is not part of the compact
              reference hero composition. */}
          <div className="mx-auto mt-5 grid w-full max-w-[1400px] gap-5 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[#E7E2D8] bg-white shadow-sm">
              <Booking
                tenantId={tenant.id || ''}
                tenantSlug={tenantSlug}
                title="Enquire about accommodation"
                subtitle="Share your details and the hostel team can contact you about rooms, availability, and admission."
                submitLabel="Send Enquiry"
                locationPlaceholder="College / area / preferred location"
              />
            </div>

            <div className="rounded-[24px] border border-[#E7E2D8] bg-white shadow-sm">
              <Contact
                tenant={tenant}
                tenantId={tenant.id || ''}
                tenantSlug={tenantSlug}
                actionButtons={tenant.actionButtons}
                title="Talk to the hostel team"
                subtitle="Ask about rooms, facilities, food, availability, fees, or visiting the property."
                callLabel="Call Hostel"
                whatsappLabel="WhatsApp Hostel"
                whatsappMessage={whatsappMessage}
              />
            </div>
          </div>
        </section>
      </main>

      {/* ==============================================================
          FOOTER
      ============================================================== */}
      <footer className="border-t border-[#E7E2D8] bg-white">
        <div className="mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-8 lg:px-12">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto_auto] lg:items-center lg:gap-16">
            {/* Brand */}
            <div className="flex items-center gap-3">
              {tenant.logoUrl ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden">
                  <Image
                    src={tenant.logoUrl}
                    alt={`${tenantName} logo`}
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <BedDouble size={22} />
                </div>
              )}

              <div>
                <p className="text-base font-black text-[#102033]">
                  {tenantName}
                </p>

                <p className="text-xs text-[#536579]">
                  Live • Learn • Grow
                </p>
              </div>
            </div>

            {/* Contact information */}
            <div className="flex flex-wrap gap-x-7 gap-y-3 text-xs text-[#536579]">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 hover:text-[#102033]"
                >
                  <span
                    style={{ color: primaryColor }}
                  >
                    ☎
                  </span>
                  {phone}
                </a>
              ) : null}

              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp.replace(
                    /\D/g,
                    '',
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-[#102033]"
                >
                  <span
                    style={{ color: primaryColor }}
                  >
                    W
                  </span>
                  {whatsapp}
                </a>
              ) : null}
            </div>

            {/* Footer navigation */}
            <div className="flex items-center gap-2 lg:border-l lg:border-[#E7E2D8] lg:pl-10">
              <span className="mr-2 text-xs font-semibold text-[#536579]">
                Follow Us
              </span>

              {[
                ['Instagram', tenant.socialLinks?.find(
                  (item) =>
                    item.platform?.toLowerCase() ===
                    'instagram',
                )?.url],
                ['Facebook', tenant.socialLinks?.find(
                  (item) =>
                    item.platform?.toLowerCase() ===
                    'facebook',
                )?.url],
                ['Website', tenant.socialLinks?.find(
                  (item) =>
                    item.platform?.toLowerCase() ===
                    'website',
                )?.url],
              ]
                .filter(([, url]) => Boolean(url))
                .map(([label, url]) => (
                  <a
                    key={label}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label as string}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-[#536579] transition-colors hover:bg-[#E8F3EC] hover:text-[#1F6B48]"
                  >
                    {label === 'Instagram'
                      ? '◎'
                      : label === 'Facebook'
                        ? 'f'
                        : '↗'}
                  </a>
                ))}
            </div>
          </div>

          <div className="mt-7 border-t border-[#E7E2D8] pt-5">
            <p className="text-[11px] text-[#8A8F98]">
              © {new Date().getFullYear()} {tenantName}. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/*
 * Small local icon component so the amenities section does not
 * require another dependency.
 */
function MapPinIcon({
  size,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size || 20}
      height={size || 20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}