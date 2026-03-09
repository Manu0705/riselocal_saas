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
    services: ["Home Visit", "Consultation"],
    products: ["Service"],
    gallery: [
      { url: "/gallery/curtain1.jpeg", category: "Gallery" },
      { url: "/gallery/curtain2.jpeg", category: "Gallery" },
    ],
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

    return {
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      ...defaults,
    }
  } catch (error) {
    // Return null on error - do not create mock tenants
    console.error(`Failed to fetch tenant: ${slug}`, error)
    return null
  }
})