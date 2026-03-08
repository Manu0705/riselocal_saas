// Admin authentication utilities
// Simple password-based auth for MVP (upgrade to proper auth later)

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

export function validateAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("admin_authenticated") === "true"
}

export function login(password: string): boolean {
  if (validateAdminPassword(password)) {
    localStorage.setItem("admin_authenticated", "true")
    return true
  }
  return false
}

export function logout(): void {
  localStorage.removeItem("admin_authenticated")
}

