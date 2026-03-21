import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getTenant, isReservedTenantSlug } from '@/lib/tenant-resolver';
import TenantPageWrapper from './tenant-page-wrapper';

import Hero from './components/hero';
import QuickActions from './components/quick-actions';

const Services = dynamic(() => import('./components/services'), {
  suspense: true,
});

const Gallery = dynamic(() => import('./components/gallery'), {
  suspense: true,
});

const Booking = dynamic(() => import('./components/booking'), {
  suspense: true,
});

const Contact = dynamic(() => import('./components/contact'), {
  suspense: true,
});

const HowItWorks = dynamic(() => import('./components/how-it-works'), {
  suspense: true,
});

function SectionSkeleton({ title }: Readonly<{ title: string }>) {
  return (
    <div className="px-4 py-4">
      <div className="mb-4 h-6 w-36 animate-pulse rounded bg-gray-200/70" aria-label={`${title} loading`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, idx) => (
          <div
            key={`${title}-skeleton-${idx}`}
            className="h-28 animate-pulse rounded-2xl border border-[var(--card-border)] bg-[var(--card)]/60"
          />
        ))}
      </div>
    </div>
  );
}

function FormSkeleton({ title }: Readonly<{ title: string }>) {
  return (
    <div className="p-4">
      <h2 className="mb-3">{title}</h2>
      <div className="grid gap-2.5">
        <div className="h-10 animate-pulse rounded bg-gray-200/70" />
        <div className="h-10 animate-pulse rounded bg-gray-200/70" />
        <div className="h-10 animate-pulse rounded bg-gray-200/70" />
      </div>
    </div>
  );
}

type Props = Readonly<{
  params: {
    tenantSlug: string;
  };
}>;

export default async function TenantPage({ params }: Props) {
  const { tenantSlug } = params;

  // Prevent dashboard routes from being treated as tenants
  if (isReservedTenantSlug(tenantSlug)) {
    notFound();
  }

  const tenant = await getTenant(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const sectionOrder = Array.isArray(tenant.sectionOrder)
    ? tenant.sectionOrder
    : ['hero', 'services', 'gallery'];

  return (
    <TenantPageWrapper>
      <div
        style={{
          // Expose tenant brand colors to descendant components.
          ['--tenant-primary' as string]: tenant.primaryColor || '#000000',
          ['--tenant-secondary' as string]: tenant.secondaryColor || '#FFFFFF',
        }}
      >
        {sectionOrder.map((sectionKey: string) => (
          <div key={sectionKey} id={sectionKey}>
            {sectionKey === 'hero' ? <Hero tenant={tenant} /> : null}

            {sectionKey === 'services' ? (
              <Suspense fallback={<SectionSkeleton title="Services" />}>
                <Services services={tenant.services || []} />
              </Suspense>
            ) : null}

            {sectionKey === 'gallery' ? (
              <Suspense fallback={<SectionSkeleton title="Gallery" />}>
                <Gallery
                  images={tenant.gallery || []}
                  galleryCategories={tenant.galleryCategories || []}
                  tenantSlug={tenantSlug}
                  tenantId={tenant.id}
                  phone={tenant.whatsapp || tenant.phone}
                  actionButtons={tenant.actionButtons}
                />
              </Suspense>
            ) : null}

            {sectionKey === 'hero' ? (
              <QuickActions
                phone={tenant.whatsapp || tenant.phone}
                tenantId={tenant.id}
                tenantSlug={tenantSlug}
                actionButtons={tenant.actionButtons}
              />
            ) : null}
          </div>
        ))}
        <Suspense fallback={<SectionSkeleton title="How It Works" />}>
          <HowItWorks />
        </Suspense>
        <Suspense fallback={<FormSkeleton title="Book Home Visit" />}>
          <Booking tenantId={tenant.id} tenantSlug={tenantSlug} />
        </Suspense>
        <Suspense fallback={<FormSkeleton title="Contact" />}>
          <Contact
            tenant={tenant}
            tenantId={tenant.id}
            tenantSlug={tenantSlug}
            actionButtons={tenant.actionButtons}
          />
        </Suspense>
      </div>
    </TenantPageWrapper>
  );
}
