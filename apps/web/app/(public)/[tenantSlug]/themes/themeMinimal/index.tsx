import Image from 'next/image';
import { BadgeCheck, Scissors, Sparkles } from 'lucide-react';
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

export default function ThemeMinimal({ tenant, tenantSlug }: Readonly<Props>) {
  const sectionOrder = Array.isArray(tenant.sectionOrder) && tenant.sectionOrder.length > 0
    ? tenant.sectionOrder
    : ['hero', 'gallery', 'services'];

  const softHighlights = (tenant.services || []).slice(0, 3).map((service) => service.name);
  const highlights = softHighlights.length > 0 ? softHighlights : ['Hair & Styling', 'Skin & Glow', 'Bridal & Beauty Care'];
  const trustCards = [
    {
      icon: Scissors,
      title: 'Style-led services',
      desc: 'Show clients your most-loved hair, makeup, grooming, and parlour services first.',
    },
    {
      icon: Sparkles,
      title: 'Result-focused presentation',
      desc: 'Let photos, premium visuals, and WhatsApp enquiries do the selling for you.',
    },
    {
      icon: BadgeCheck,
      title: 'Easy appointment capture',
      desc: 'Convert discovery into booked slots with fast lead capture and follow-up.',
    },
  ];

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#fff7fb_0%,#fdf2f8_32%,#fffdfd_100%)]"
      style={{
        ['--tenant-primary' as string]: tenant.primaryColor || '#db2777',
        ['--tenant-secondary' as string]: tenant.secondaryColor || '#fdf2f8',
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        {sectionOrder.map((sectionKey) => {
          if (sectionKey === 'hero') {
            return (
              <section
                key="hero"
                id="hero"
                className="overflow-hidden rounded-[30px] border border-rose-100 bg-white shadow-[0_24px_70px_rgba(190,24,93,0.12)]"
              >
                <div className="grid items-center gap-0 lg:grid-cols-[1fr_0.92fr]">
                  <div className="p-5 sm:p-7 lg:p-8">
                    <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-rose-600">
                      Salon & beauty theme
                    </span>
                    <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                      {tenant.name || 'RiseLocal Beauty Studio'}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                      {tenant.tagline ||
                        'Create a calm, premium first impression for beauty, wellness, salon, and parlour customers while still capturing every booking and WhatsApp enquiry.'}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {highlights.map((item) => (
                        <span key={item} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">
                          {item}
                        </span>
                      ))}
                    </div>

                    <QuickActions
                      phone={tenant.whatsapp || tenant.phone}
                      tenantId={tenant.id}
                      tenantSlug={tenantSlug}
                      actionButtons={tenant.actionButtons}
                      whatsappLabel="Chat for Appointment"
                      callLabel="Call Salon"
                      whatsappMessage={`Hi, I want to book an appointment with ${tenant.name || 'your salon'}. Please share available slots.`}
                    />

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {trustCards.map((card) => {
                        const Icon = card.icon;
                        return (
                          <div key={card.title} className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
                            <Icon size={18} className="text-rose-500" />
                            <p className="mt-2 text-sm font-semibold text-slate-900">{card.title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">{card.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative min-h-[260px] lg:min-h-full">
                    <Image
                      src={
                        tenant.bannerUrl ||
                        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1400&q=80&auto=format&fit=crop'
                      }
                      alt={tenant.name || 'Beauty storefront'}
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/15 via-transparent to-transparent" />
                  </div>
                </div>
              </section>
            );
          }

          if (sectionKey === 'services') {
            return (
              <section key="services" id="services" className="mt-6 rounded-[24px] border border-rose-100 bg-white p-2 shadow-[0_18px_45px_rgba(244,114,182,0.08)]">
                <div className="px-4 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-500">Signature offerings</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Treatments and services your clients can explore</h2>
                </div>
                <Services services={tenant.services || []} />
              </section>
            );
          }

          if (sectionKey === 'gallery') {
            return (
              <section key="gallery" id="gallery" className="mt-6 rounded-[24px] border border-rose-100 bg-white p-2 shadow-[0_18px_45px_rgba(244,114,182,0.08)]">
                <Gallery
                  images={tenant.gallery || []}
                  galleryCategories={tenant.galleryCategories || []}
                  tenantSlug={tenantSlug}
                  tenantId={tenant.id}
                  phone={tenant.whatsapp || tenant.phone}
                  actionButtons={tenant.actionButtons}
                />
              </section>
            );
          }

          return null;
        })}

        <section className="mt-6 rounded-[24px] border border-rose-100 bg-white p-4 shadow-[0_18px_45px_rgba(244,114,182,0.08)] sm:p-5">
          <HowItWorks
            title="How clients usually book"
            subtitle="Ideal for salons, parlours, beauty studios, and wellness businesses that rely on quick appointment follow-up."
            steps={[
              {
                title: 'Browse services or looks',
                desc: 'Clients explore treatments, packages, and real result photos before reaching out.',
              },
              {
                title: 'Message for slot availability',
                desc: 'They enquire on WhatsApp for pricing, bridal packages, or the next open appointment.',
              },
              {
                title: 'Reserve appointment',
                desc: 'Your team confirms the time, service type, and visit details in minutes.',
              },
              {
                title: 'Follow up and retain',
                desc: 'Keep rebooking and referral opportunities moving with a warm post-visit follow-up.',
              },
            ]}
          />
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-[24px] border border-rose-100 bg-white shadow-[0_18px_45px_rgba(244,114,182,0.08)]">
            <Booking
              tenantId={tenant.id}
              tenantSlug={tenantSlug}
              title="Reserve your appointment"
              subtitle="Share your preferred service, location, and date so the salon can confirm the best slot."
              submitLabel="Reserve Slot"
              locationPlaceholder="Area / branch"
            />
          </section>
          <section className="rounded-[24px] border border-rose-100 bg-white shadow-[0_18px_45px_rgba(244,114,182,0.08)]">
            <Contact
              tenant={tenant}
              tenantId={tenant.id}
              tenantSlug={tenantSlug}
              actionButtons={tenant.actionButtons}
              title="Reach the beauty desk"
              subtitle="Great for appointment help, bridal packages, event bookings, and premium treatment enquiries."
              callLabel="Call Salon"
              whatsappLabel="Chat for Appointment"
              whatsappMessage={`Hi, I want to book a service with ${tenant.name || 'your salon'}. Please share available slots.`}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
