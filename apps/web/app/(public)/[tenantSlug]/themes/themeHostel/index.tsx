import Image from 'next/image';
import {
  BedDouble,
  MapPin,
  ShieldCheck,
  Utensils,
  Wifi,
} from 'lucide-react';

import type { ResolvedTenant } from '@/lib/tenant-resolver';

import Services from '../../components/services';
import Gallery from '../../components/gallery';
import QuickActions from '../../components/quick-actions';
import Booking from '../../components/booking';
import Contact from '../../components/contact';
import HowItWorks from '../../components/how-it-works';

type Props = {
  tenant: ResolvedTenant;
  tenantSlug: string;
};

export default function ThemeHostel({ tenant, tenantSlug }: Readonly<Props>) {
  const primaryColor = tenant.primaryColor || '#0B2A55';
  const secondaryColor = tenant.secondaryColor || '#087CF0';

  const sectionOrder =
    Array.isArray(tenant.sectionOrder) && tenant.sectionOrder.length > 0
      ? tenant.sectionOrder
      : ['hero', 'services', 'gallery'];

  const services = Array.isArray(tenant.services) ? tenant.services : [];
  const gallery = Array.isArray(tenant.gallery) ? tenant.gallery : [];

  const highlights = [
    {
      icon: BedDouble,
      title: 'Comfortable Rooms',
      description: 'Clean and comfortable accommodation designed for students.',
    },
    {
      icon: Utensils,
      title: 'Quality Food',
      description: 'Convenient food and dining options for everyday hostel life.',
    },
    {
      icon: ShieldCheck,
      title: 'Safe & Secure',
      description: 'A secure environment where students can stay with confidence.',
    },
    {
      icon: Wifi,
      title: 'Connected Living',
      description: 'Stay connected with facilities designed for modern student life.',
    },
  ];

  const contactPhone = tenant.whatsapp || tenant.phone;

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{
        ['--tenant-primary' as string]: primaryColor,
        ['--tenant-secondary' as string]: secondaryColor,
      }}
    >
      <main>
        {sectionOrder.map((sectionKey) => {
          if (sectionKey === 'hero') {
            return (
              <section
                key="hero"
                id="hero"
                className="relative overflow-hidden bg-[var(--tenant-primary)] text-white"
              >
                <div className="mx-auto grid min-h-[520px] w-full max-w-6xl lg:grid-cols-2">
                  <div className="flex items-center px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
                    <div className="w-full">
                      <div className="mb-5 flex items-center gap-3">
                        {tenant.logoUrl ? (
                          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white p-1">
                            <Image
                              src={tenant.logoUrl}
                              alt={tenant.name || 'Hostel logo'}
                              fill
                              sizes="48px"
                              className="object-contain"
                            />
                          </div>
                        ) : null}

                        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                          Student Accommodation
                        </span>
                      </div>

                      <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                        {tenant.name || 'Your Home Away From Home'}
                      </h1>

                      <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
                        {tenant.tagline ||
                          'A comfortable, safe, and welcoming place for students to live, study, and grow.'}
                      </p>

                      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <QuickActions
                          phone={contactPhone}
                          tenantId={tenant.id || ''}
                          tenantSlug={tenantSlug}
                          actionButtons={tenant.actionButtons}
                          whatsappLabel="Enquire on WhatsApp"
                          callLabel="Call Hostel"
                          whatsappMessage={`Hi, I am interested in ${tenant.name || 'your hostel'}. Please share accommodation details and availability.`}
                        />
                      </div>

                      <div className="mt-8 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
                          <ShieldCheck size={16} />
                          Safe Environment
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
                          <BedDouble size={16} />
                          Comfortable Stay
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
                          <MapPin size={16} />
                          Convenient Location
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative min-h-[320px] lg:min-h-full">
                    <Image
                      src={
                        tenant.bannerUrl ||
                        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1400&q=80&auto=format&fit=crop'
                      }
                      alt={tenant.name || 'Hostel accommodation'}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                      priority
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--tenant-primary)]/70 via-transparent to-transparent lg:bg-gradient-to-r" />
                  </div>
                </div>
              </section>
            );
          }

          if (sectionKey === 'services') {
            return (
              <section
                key="services"
                id="services"
                className="mx-auto mt-6 w-full max-w-6xl rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm"
              >
                <div className="px-4 pt-5 sm:px-6">
                  <p
                    className="text-xs font-bold uppercase tracking-[0.25em]"
                    style={{ color: primaryColor }}
                  >
                    Stay with confidence
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    Everything you need for a comfortable stay
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Explore the services and facilities available at{' '}
                    {tenant.name || 'our hostel'}.
                  </p>
                </div>

                <Services services={services} />
              </section>
            );
          }

          if (sectionKey === 'gallery') {
            return (
              <section
                key="gallery"
                id="gallery"
                className="mx-auto mt-6 w-full max-w-6xl rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm"
              >
                <div className="px-4 pt-5 sm:px-6">
                  <p
                    className="text-xs font-bold uppercase tracking-[0.25em]"
                    style={{ color: primaryColor }}
                  >
                    Our hostel
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    Take a look around
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Explore rooms, common areas, facilities, and the overall
                    hostel experience.
                  </p>
                </div>

                <Gallery
                  images={gallery}
                  galleryCategories={tenant.galleryCategories || []}
                  tenantSlug={tenantSlug}
                  tenantId={tenant.id || ''}
                  phone={contactPhone}
                  actionButtons={tenant.actionButtons}
                />
              </section>
            );
          }

          return null;
        })}

        <section className="mx-auto mt-6 w-full max-w-6xl px-1">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: primaryColor }}
              >
                Why choose us
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                More than just a place to stay
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                A hostel experience built around comfort, safety, convenience,
                and a supportive student environment.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((highlight) => {
                const Icon = highlight.icon;

                return (
                  <div
                    key={highlight.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Icon size={20} />
                    </div>

                    <h3 className="mt-4 text-base font-bold text-slate-950">
                      {highlight.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {highlight.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 w-full max-w-6xl px-1">
          <div
            className="overflow-hidden rounded-[28px] p-5 text-white sm:p-8"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            <HowItWorks
              title="Simple path to your new stay"
              subtitle="Make an enquiry, understand the accommodation, and take the next step toward joining the hostel."
              steps={[
                {
                  title: 'Send an enquiry',
                  desc: 'Tell us about your accommodation requirement and preferred stay.',
                },
                {
                  title: 'Get hostel details',
                  desc: 'Receive information about rooms, facilities, food, location, and availability.',
                },
                {
                  title: 'Plan your visit',
                  desc: 'Connect with the hostel team and arrange a visit or further discussion.',
                },
                {
                  title: 'Complete admission',
                  desc: 'Move forward with your hostel admission and start your stay.',
                },
              ]}
            />
          </div>
        </section>

        <div className="mx-auto mt-6 grid w-full max-w-6xl gap-5 px-1 lg:grid-cols-2">
          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <Booking
              tenantId={tenant.id || ''}
              tenantSlug={tenantSlug}
              title="Enquire about accommodation"
              subtitle="Share your details and the hostel team can contact you about rooms, availability, and admission."
              submitLabel="Send Enquiry"
              locationPlaceholder="College / area / preferred location"
            />
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <Contact
              tenant={tenant}
              tenantId={tenant.id || ''}
              tenantSlug={tenantSlug}
              actionButtons={tenant.actionButtons}
              title="Talk to the hostel team"
              subtitle="Ask about rooms, facilities, food, availability, fees, or visiting the property."
              callLabel="Call Hostel"
              whatsappLabel="WhatsApp Hostel"
              whatsappMessage={`Hi, I am interested in ${tenant.name || 'your hostel'}. Please share more information about rooms and availability.`}
            />
          </section>
        </div>

        <section className="mx-auto mt-6 w-full max-w-6xl px-1 pb-8">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.25em]"
                  style={{ color: primaryColor }}
                >
                  Find your stay
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Ready to make this your new home?
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Contact {tenant.name || 'the hostel'} to check current
                  availability and learn more about the accommodation.
                </p>
              </div>

              {contactPhone ? (
                <a
                  href={`tel:${contactPhone}`}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Call Now
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}