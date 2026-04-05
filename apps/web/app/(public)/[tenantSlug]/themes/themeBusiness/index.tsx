import Image from 'next/image';
import { BadgeCheck, Camera, ShieldCheck } from 'lucide-react';
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

export default function ThemeBusiness({ tenant, tenantSlug }: Readonly<Props>) {
  const sectionOrder = Array.isArray(tenant.sectionOrder) && tenant.sectionOrder.length > 0
    ? tenant.sectionOrder
    : ['hero', 'services', 'gallery'];

  const trustPoints = (tenant.services || []).slice(0, 3).map((service) => service.name);
  const points = trustPoints.length > 0 ? trustPoints : ['CCTV Installation', 'Remote Monitoring', 'Annual Maintenance'];
  const trustCards = [
    {
      icon: Camera,
      title: 'Site-ready solutions',
      desc: 'Present indoor, outdoor, and multi-camera options clearly for homes, shops, and offices.',
    },
    {
      icon: ShieldCheck,
      title: 'Trusted installation',
      desc: 'Build confidence with fast surveys, setup support, and maintenance positioning.',
    },
    {
      icon: BadgeCheck,
      title: 'Long-term service',
      desc: 'Promote AMC, remote monitoring, and dependable after-installation response from day one.',
    },
  ];

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#07111f_0%,#10233e_24%,#eff4fb_24%,#f8fafc_100%)]"
      style={{
        ['--tenant-primary' as string]: tenant.primaryColor || '#0f766e',
        ['--tenant-secondary' as string]: tenant.secondaryColor || '#e6fffb',
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        {sectionOrder.map((sectionKey) => {
          if (sectionKey === 'hero') {
            return (
              <section
                key="hero"
                id="hero"
                className="overflow-hidden rounded-[28px] border border-cyan-400/10 bg-[#08111f] text-white shadow-[0_24px_70px_rgba(2,12,27,0.45)]"
              >
                <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
                  <div className="p-5 sm:p-7 lg:p-8">
                    <span className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                      Security & CCTV theme
                    </span>
                    <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                      {tenant.name || 'RiseLocal Security Hub'}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                      {tenant.tagline ||
                        'Present CCTV, security, surveillance, and monitoring services in a trusted business-ready layout that still captures every inbound lead.'}
                    </p>

                    <div className="mt-5 grid gap-2 sm:grid-cols-3">
                      {points.map((item) => (
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
                      whatsappLabel="Chat for Site Survey"
                      callLabel="Call Security Desk"
                      whatsappMessage={`Hi, I need CCTV/security help from ${tenant.name || 'your team'}. Please guide me with the right setup.`}
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
                        'https://images.unsplash.com/photo-1558002038-1055907df827?w=1400&q=80&auto=format&fit=crop'
                      }
                      alt={tenant.name || 'Security storefront'}
                      fill
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#08111f] via-[#08111f]/55 to-transparent" />
                  </div>
                </div>
              </section>
            );
          }

          if (sectionKey === 'services') {
            return (
              <section key="services" id="services" className="mt-6 rounded-[24px] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="px-4 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-700">Solutions</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Security offerings built for homes, shops, and offices</h2>
                </div>
                <Services services={tenant.services || []} />
              </section>
            );
          }

          if (sectionKey === 'gallery') {
            return (
              <section key="gallery" id="gallery" className="mt-6 rounded-[24px] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
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

        <section className="mt-6 rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-5">
          <HowItWorks
            title="How security enquiries convert"
            subtitle="Structured for CCTV and surveillance teams that win business through trust, speed, and clear site planning."
            steps={[
              {
                title: 'Share property or site need',
                desc: 'Prospects explain whether they need coverage for home, office, warehouse, or retail space.',
              },
              {
                title: 'Get survey and recommendation',
                desc: 'Your team suggests camera count, recording setup, and the right installation plan.',
              },
              {
                title: 'Approve quote and schedule',
                desc: 'Move the lead from enquiry to site visit, pricing, and installation date.',
              },
              {
                title: 'Install and support',
                desc: 'Reinforce trust with monitoring guidance, AMC, and post-installation service follow-up.',
              },
            ]}
          />
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-[24px] border border-slate-200 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <Booking
              tenantId={tenant.id}
              tenantSlug={tenantSlug}
              title="Book a site survey"
              subtitle="Tell the team about your home, shop, or office requirement and request a visit or callback."
              submitLabel="Request Site Visit"
              locationPlaceholder="Site address / area"
            />
          </section>
          <section className="rounded-[24px] border border-slate-200 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <Contact
              tenant={tenant}
              tenantId={tenant.id}
              tenantSlug={tenantSlug}
              actionButtons={tenant.actionButtons}
              title="Speak to a security advisor"
              subtitle="Use this for urgent CCTV enquiries, AMC support, new installation planning, or a quick consultation."
              callLabel="Call Security Desk"
              whatsappLabel="Chat for Survey"
              whatsappMessage={`Hi, I need CCTV or security guidance from ${tenant.name || 'your team'}. Please help with the best setup.`}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
