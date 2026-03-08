// API client for admin panel
const API_BASE = process.env.NEXT_PUBLIC_API || "http://localhost:4000"

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

export const adminApi = {
  async get(path: string) {
    const res = await fetch(buildUrl(path))
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error("API did not return JSON: " + text.slice(0, 100))
    }
  },

  async post(path: string, data: any) {
    const res = await fetch(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  async put(path: string, data: any) {
    const res = await fetch(buildUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  async delete(path: string) {
    const res = await fetch(buildUrl(path), {
      method: "DELETE",
    })
    return res.json()
  },
}
