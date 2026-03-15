import { notFound } from 'next/navigation';
import { getTenant, isReservedTenantSlug } from '@/lib/tenant-resolver';

import Hero from './components/hero';
import QuickActions from './components/quick-actions';
import Services from './components/services';
import Gallery from './components/gallery';
import HowItWorks from './components/how-it-works';
import Booking from './components/booking';
import Contact from './components/contact';

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

  const sections: Record<string, JSX.Element> = {
    hero: <Hero tenant={tenant} />,
    services: <Services services={tenant.services || []} />,
    gallery: (
      <Gallery
        images={tenant.gallery || []}
        tenantSlug={tenantSlug}
        tenantId={tenant.id}
        phone={tenant.whatsapp || tenant.phone}
        actionButtons={tenant.actionButtons}
      />
    ),
  };

  return (
    <div
      style={{
        // Expose tenant brand colors to descendant components.
        ['--tenant-primary' as string]: tenant.primaryColor || '#000000',
        ['--tenant-secondary' as string]: tenant.secondaryColor || '#FFFFFF',
      }}
    >
      {sectionOrder.map((sectionKey: string) => (
        <div key={sectionKey}>{sections[sectionKey] ?? null}</div>
      ))}

      <QuickActions
        phone={tenant.whatsapp || tenant.phone}
        tenantId={tenant.id}
        tenantSlug={tenantSlug}
        actionButtons={tenant.actionButtons}
      />
      <HowItWorks />
      <Booking tenantId={tenant.id} tenantSlug={tenantSlug} actionButtons={tenant.actionButtons} />
      <Contact
        tenant={tenant}
        tenantId={tenant.id}
        tenantSlug={tenantSlug}
        actionButtons={tenant.actionButtons}
      />
    </div>
  );
}
