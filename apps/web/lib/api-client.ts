const API_BASE =
  (typeof process !== "undefined" && (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API))
    ? String(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API).replace(/\/+$/, "")
    : "http://localhost:4000"

function buildUrl(path: string) {
  const sanitizedPath = path.startsWith("/") ? path : `/${path}`
  const base = API_BASE.replace(/\/+$/, "")

  const baseHasApi = base.toLowerCase().endsWith("/api")
  const pathHasApi = sanitizedPath.toLowerCase().startsWith("/api")
  const apiPrefix = baseHasApi ? "" : "/api"
  const normalizedPath = pathHasApi ? sanitizedPath : `${apiPrefix}${sanitizedPath}`

  return `${base}${normalizedPath}`
}

function getStoredTenantSlug(): string | null {
  if (globalThis.window === undefined) return null
  const value = globalThis.localStorage.getItem("tenantSlug")
  return value && value.trim().length > 0 ? value.trim().toLowerCase() : null
}

function withTenantQuery(path: string): string {
  const slug = getStoredTenantSlug()
  if (!slug) return path

  const separator = path.includes("?") ? "&" : "?"
  return `${path}${separator}tenantSlug=${encodeURIComponent(slug)}`
}

function buildAuthHeaders(includeJson = false): Record<string, string> {
  const token = (globalThis.window !== undefined && localStorage.getItem("token")) || null
  const tenantSlug = getStoredTenantSlug()

  const headers: Record<string, string> = {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantSlug ? { "x-tenant-slug": tenantSlug } : {}),
  }

  return headers
}

export const api = {
  async get(path: string) {
    const res = await fetch(buildUrl(withTenantQuery(path)), {
      headers: buildAuthHeaders(),
    })

    const text = await res.text()

    try {
      return JSON.parse(text)
    } catch {
      throw new Error("API did not return JSON: " + text.slice(0, 100))
    }
  },

  async post(path: string, data: any) {
    const res = await fetch(buildUrl(withTenantQuery(path)), {
      method: "POST",
      headers: buildAuthHeaders(true),
      body: JSON.stringify(data),
    })

    return res.json()
  },

  async patch(path: string, data?: any) {
    const headers: Record<string, string> = buildAuthHeaders()

    let body: string | undefined
    if (data !== undefined) {
      headers["Content-Type"] = "application/json"
      body = JSON.stringify(data)
    }

    const res = await fetch(buildUrl(withTenantQuery(path)), {
      method: "PATCH",
      headers,
      body,
    })

    return res.json()
  }
}