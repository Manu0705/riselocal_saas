import { cache } from "react"

export const RESERVED_ROUTES = [
  "dashboard",
  "admin",
  "analytics",
  "leads",
  "followups",
  "feedback",
  "tenants",
  "settings",
  "login",
  "api",
  "_next",
  "qa",
  "www"
]

export const isReservedTenantSlug = (slug: string) => RESERVED_ROUTES.includes(slug)

export const getTenant = cache(async (slug: string) => {

  // prevent dashboard routes from being treated as tenants
  if (isReservedTenantSlug(slug)) {
    return null
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/+$/, "")

  const defaults = {
    phone: "0000000000",
    whatsapp: "0000000000",
    services: [
      { name: "Home Visit", description: "On-site consultation and measurement." },
      { name: "Consultation", description: "Guidance on styles, pricing, and timelines." },
    ],
    products: ["Service"],
    gallery: [
      { url: "/gallery/curtain1.jpeg", category: "Gallery" },
      { url: "/gallery/curtain2.jpeg", category: "Gallery" },
    ],
    sectionOrder: ["hero", "services", "gallery"],
    socialLinks: [],
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    logoShape: "circle",
  }

  try {
    const res = await fetch(`${apiBase}/api/tenants/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return null
    }

    const payload = await res.json()
    const tenant = payload?.data

    if (!tenant) {
      return null
    }

    const settings = tenant.settings ?? {}

    return {
      ...defaults,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      phone: settings.businessPhone || defaults.phone,
      whatsapp: settings.businessWhatsApp || settings.businessPhone || defaults.whatsapp,
      tagline: settings.tagline || undefined,
      logoUrl: settings.logoUrl || undefined,
      bannerUrl: settings.bannerUrl || undefined,
      logoShape: settings.logoShape || defaults.logoShape,
      primaryColor: settings.primaryColor || defaults.primaryColor,
      secondaryColor: settings.secondaryColor || defaults.secondaryColor,
      sectionOrder: Array.isArray(settings.sectionOrder)
        ? settings.sectionOrder.map((entry: unknown) => String(entry))
        : defaults.sectionOrder,
      services: Array.isArray(tenant.services) && tenant.services.length > 0
        ? tenant.services
        : defaults.services,
      gallery: Array.isArray(tenant.galleryImages) && tenant.galleryImages.length > 0
        ? tenant.galleryImages
        : defaults.gallery,
      socialLinks: Array.isArray(tenant.socialLinks) ? tenant.socialLinks : defaults.socialLinks,
    }
  } catch (error) {
    // Return null on error - do not create mock tenants
    console.error(`Failed to fetch tenant: ${slug}`, error)
    return null
  }
})