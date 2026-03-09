const API_BASE = process.env.NEXT_PUBLIC_API || "http://localhost:4000"

function buildAuthUrl(path: string) {
  const base = API_BASE.replace(/\/+$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}/api${normalizedPath}`
}

export function getAdminToken(): string | null {
  if (globalThis.window === undefined) return null
  return localStorage.getItem("admin_token")
}

export function isAuthenticated(): boolean {
  return Boolean(getAdminToken())
}

export async function login(password: string): Promise<boolean> {
  const res = await fetch(buildAuthUrl("/auth/admin-login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@riselocal.in",
      password,
    }),
  })

  if (!res.ok) {
    return false
  }

  const payload = await res.json()
  const token = payload?.token

  if (!token || typeof token !== "string") {
    return false
  }

  localStorage.setItem("admin_token", token)
  return true
}

export function logout(): void {
  localStorage.removeItem("admin_token")
}

