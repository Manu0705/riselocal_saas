const TOKEN_KEY = "token"
const TENANT_SLUG_KEY = "tenantSlug"

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API)
    ? process.env.NEXT_PUBLIC_API.replace(/\/+$/, "")
    : "http://localhost:4000"

function buildUrl(path: string) {
  const sanitizedPath = path.startsWith("/") ? path : `/${path}`
  const base = API_BASE.replace(/\/+$/, "")

  const baseHasApi = base.toLowerCase().endsWith("/api")
  const pathHasApi = sanitizedPath.toLowerCase().startsWith("/api")
  const normalizedPath = pathHasApi
    ? sanitizedPath
    : `${baseHasApi ? "" : "/api"}${sanitizedPath}`

  return `${base}${normalizedPath}`
}

export async function login(
  email: string,
  password: string,
  tenantId?: string,
  role?: string
) {
  try {
    const res = await fetch(buildUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, tenantId, role }),
    })

    const data = await res.json()

    if (data?.token) {
      localStorage.setItem(TOKEN_KEY, data.token)
    }

    return data
  } catch (error) {
    console.error("auth.login failed", error)
    return { error: (error as Error).message || "Failed to reach auth server" }
  }
}

export function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getToken())
}

export function setTenantSlug(slug: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(TENANT_SLUG_KEY, slug)
}

export function getTenantSlug() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TENANT_SLUG_KEY)
}

export function clearAuth() {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TENANT_SLUG_KEY)
}
