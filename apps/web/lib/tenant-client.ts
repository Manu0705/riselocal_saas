import { buildBrowserApiUrl, buildUpstreamApiUrl, getApiBaseCandidates } from "@/lib/api-endpoint"
import { api } from "@/lib/api-client"

function buildApiUrl(path: string): string {
  if (typeof window !== "undefined") {
    return buildBrowserApiUrl(path)
  }

  return buildUpstreamApiUrl(getApiBaseCandidates()[0], path)
}

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) }
  const token = globalThis.window !== undefined ? localStorage.getItem("token") : null
  const tenantSlug = globalThis.window !== undefined ? localStorage.getItem("tenantSlug") : null

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (tenantSlug) {
    headers["x-tenant-slug"] = tenantSlug
  }

  return headers
}

export function getTenantApiClient() {
  return {
    async get(path: string) {
      const res = await fetch(buildApiUrl(path), {
        headers: getAuthHeaders(),
      })
      return res.json()
    },

    async post(path: string, body: any, options?: { headers?: Record<string, string> }) {
      const isFormData = body instanceof FormData
      const rawHeaders = isFormData
        ? { ...(options?.headers || {}) }
        : { "Content-Type": "application/json", ...(options?.headers || {}) }
      if (isFormData) {
        delete rawHeaders["Content-Type"]
      }
      const headers = getAuthHeaders(rawHeaders)

      const res = await fetch(buildApiUrl(path), {
        method: "POST",
        headers,
        body: isFormData ? body : JSON.stringify(body),
      })
      return res.json()
    },

    async put(path: string, body: any, options?: { headers?: Record<string, string> }) {
      const isFormData = body instanceof FormData
      const rawHeaders = isFormData
        ? { ...(options?.headers || {}) }
        : { "Content-Type": "application/json", ...(options?.headers || {}) }
      if (isFormData) {
        delete rawHeaders["Content-Type"]
      }
      const headers = getAuthHeaders(rawHeaders)

      const res = await fetch(buildApiUrl(path), {
        method: "PUT",
        headers,
        body: isFormData ? body : JSON.stringify(body),
      })
      return res.json()
    },

    async delete(path: string) {
      const res = await fetch(buildApiUrl(path), {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      return res.json()
    },
  }
}

export type TenantRecord = {
  id: string
  name?: string
  slug?: string | null
  domain?: string | null
  createdAt?: string
}

export function toArrayPayload(data: unknown): any[] {
  const nested = (data as { data?: unknown })?.data

  if (Array.isArray(nested)) {
    return nested
  }

  if (Array.isArray(data)) {
    return data
  }

  return []
}

export function matchTenant(tenant: TenantRecord, tenantKey: string): boolean {
  const key = tenantKey.trim().toLowerCase()
  const id = String(tenant.id ?? "").trim().toLowerCase()
  const slug = String(tenant.slug ?? "").trim().toLowerCase()
  const domain = String(tenant.domain ?? "").trim().toLowerCase()

  return id === key || slug === key || domain === key
}

export async function resolveTenant(tenantKey: string): Promise<TenantRecord | null> {
  const response = await api.get("/tenants")
  const tenants = toArrayPayload(response) as TenantRecord[]

  if (!tenantKey) return null

  const tenant = tenants.find((entry) => matchTenant(entry, tenantKey))
  return tenant ?? null
}

export async function fetchLeadsForTenant(tenantKey: string): Promise<any[]> {
  const tenant = await resolveTenant(tenantKey).catch(() => null)

  const candidateKeys = [tenant?.slug, tenant?.id, tenantKey].filter(
    (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index
  )

  let lastError = "Tenant not found"

  for (const key of candidateKeys) {
    const leadsResponse = await api.get(`/tenant/${key}/leads`)

    if ((leadsResponse as { success?: boolean; message?: string })?.success === false) {
      lastError =
        (leadsResponse as { message?: string })?.message ??
        "Failed to fetch leads"
      continue
    }

    const items = toArrayPayload(leadsResponse)

    if (items.length > 0 || (leadsResponse as { success?: boolean })?.success === true) {
      return items
    }
  }

  if (!candidateKeys.length) {
    throw new Error("Tenant not found")
  }

  throw new Error(lastError)
}
