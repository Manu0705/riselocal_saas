import { notFound } from "next/navigation"
import { getTenant, isReservedTenantSlug } from "@/lib/tenant-resolver"

import Hero from "./components/hero"
import QuickActions from "./components/quick-actions"
import Services from "./components/services"
import Gallery from "./components/gallery"
import HowItWorks from "./components/how-it-works"
import Booking from "./components/booking"
import Contact from "./components/contact"

type Props = {
  params: {
    tenantSlug: string
  }
}

export default async function TenantPage({ params }: Props) {
  const { tenantSlug } = params

  // Prevent dashboard routes from being treated as tenants
  if (isReservedTenantSlug(tenantSlug)) {
    notFound()
  }

  const tenant = await getTenant(tenantSlug)

  if (!tenant) {
    notFound()
  }

  return (
    <>
      <Hero tenant={tenant} />

      <QuickActions phone={tenant.phone} />

      <Services
        services={tenant.services || []}
      />

      <Gallery
        images={tenant.gallery || []}
        tenantSlug={tenantSlug}
        phone={tenant.phone}
      />

      <HowItWorks />

      <Booking tenant={tenant} />

      <Contact tenant={tenant} />
    </>
  )
}