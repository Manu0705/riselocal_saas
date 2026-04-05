import Image from 'next/image';
import { Laptop, ShieldCheck, Smartphone } from 'lucide-react';
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

export default function ThemeModern({ tenant, tenantSlug }: Readonly<Props>) {
  const sectionOrder = Array.isArray(tenant.sectionOrder) && tenant.sectionOrder.length > 0
    ? tenant.sectionOrder
    : ['hero', 'services', 'gallery'];

  const offerings = (tenant.services || []).slice(0, 3).map((service) => service.name);
  const highlights = offerings.length > 0 ? offerings : ['Laptops & PCs', 'Mobiles & Accessories', 'Repair & Support'];
  const trustCards = [
    {
      icon: Laptop,
      title: 'Latest devices',
      desc: 'Highlight laptops, desktops, and upgrade-ready hardware customers are actively searching for.',
    },
    {
      icon: Smartphone,
      title: 'Accessories & stock checks',
      desc: 'Turn price, stock, and accessory enquiries into WhatsApp conversations faster.',
    },
    {
      icon: ShieldCheck,
      title: 'Reliable support',
      desc: 'Promote repairs, setup help, warranty guidance, and after-sales trust from the first click.',
    },
  ];

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#08132a_28%,#eef4ff_28%,#f8fbff_100%)]"
      style={{
        ['--tenant-primary' as string]: tenant.primaryColor || '#2563eb',
        ['--tenant-secondary' as string]: tenant.secondaryColor || '#dbeafe',
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        {sectionOrder.map((sectionKey) => {
          if (sectionKey === 'hero') {
            return (
              <section
                key="hero"
                id="hero"
                className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 text-white shadow-[0_24px_70px_rgba(2,6,23,0.45)]"
              >
                <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="p-5 sm:p-7 lg:p-8">
                    <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                      Modern tech storefront
                    </span>
                    <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {tenant.name || 'RiseLocal Tech Store'}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                      {tenant.tagline ||
                        'Showcase laptops, mobiles, accessories, and hardware with a storefront built to convert chats, calls, and enquiry clicks into real leads.'}
                    </p>

                    <div className="mt-5 grid gap-2 sm:grid-cols-3">
                      {highlights.map((item) => (
                        <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-slate-100">
                          {item}
                        </div>
                      ))}
                    </div>

                    <QuickActions
                      phone={tenant.whatsapp || tenant.phone}
                      tenantId={tenant.id}
                      tenantSlug={tenantSlug}
                      actionButtons={tenant.actionButtons}
                      whatsappLabel="Chat for Price & Stock"
                      callLabel="Call Store"
                      whatsappMessage={`Hi, I'm interested in ${tenant.name || 'your products'}. Please share pricing and availability.`}
                    />

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {trustCards.map((card) => {
                        const Icon = card.icon;
                        return (
                          <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <Icon size={18} className="text-cyan-300" />
                            <p className="mt-2 text-sm font-semibold text-white">{card.title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-300">{card.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative min-h-[260px] lg:min-h-full">
                    <Image
                      src={
                        tenant.bannerUrl ||
                        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=80&auto=format&fit=crop'
                      }
                      alt={tenant.name || 'Modern storefront'}
                      fill
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/45 to-transparent" />
                  </div>
                </div>
              </section>
            );
          }

          if (sectionKey === 'services') {
            return (
              <section key="services" id="services" className="mt-6 rounded-[24px] bg-white/90 p-2 shadow-[0_18px_45px_rgba(37,99,235,0.08)] backdrop-blur">
                <div className="px-4 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-600">Popular categories</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Products and services customers ask for most</h2>
                </div>
                <Services services={tenant.services || []} />
              </section>
            );
          }

          if (sectionKey === 'gallery') {
            return (
              <section key="gallery" id="gallery" className="mt-6 rounded-[24px] bg-white/90 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
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

        <section className="mt-6 rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-5">
          <HowItWorks
            title="How buyers usually convert"
            subtitle="Built for electronics, mobile, and hardware stores that get most enquiries on call and WhatsApp."
            steps={[
              {
                title: 'Share product need',
                desc: 'Customers message the device, accessory, or repair requirement they need help with.',
              },
              {
                title: 'Get pricing or stock update',
                desc: 'Your team replies quickly with availability, alternatives, and a callback if needed.',
              },
              {
                title: 'Book visit, pickup, or delivery',
                desc: 'Move the enquiry toward store visit, home setup, or doorstep delivery.',
              },
              {
                title: 'Close with follow-up',
                desc: 'Keep the lead warm with fast WhatsApp follow-up and repeat purchase support.',
              },
            ]}
          />
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-[24px] border border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <Booking
              tenantId={tenant.id}
              tenantSlug={tenantSlug}
              title="Request a quote or callback"
              subtitle="Leave your requirement and the store can respond with pricing, stock status, or a follow-up call."
              submitLabel="Request Quote"
              locationPlaceholder="Area / delivery location"
            />
          </section>
          <section className="rounded-[24px] border border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <Contact
              tenant={tenant}
              tenantId={tenant.id}
              tenantSlug={tenantSlug}
              actionButtons={tenant.actionButtons}
              title="Talk to the store team"
              subtitle="Best for stock checks, repair requests, bundle pricing, and urgent product questions."
              callLabel="Call Store"
              whatsappLabel="Chat for Availability"
              whatsappMessage={`Hi, I want to know more about ${tenant.name || 'your products'} and current availability.`}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
