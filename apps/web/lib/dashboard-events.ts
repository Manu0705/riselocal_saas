const DASHBOARD_REFRESH_EVENT = "dashboard:data-refresh"
const DASHBOARD_REFRESH_STORAGE_KEY = "dashboard:last-refresh"
const DASHBOARD_LIVE_TENANT_PREFIX = "dashboard:tenant-live:"

function normalizeTenantKey(tenantKey?: string | null): string {
  return String(tenantKey ?? "").trim().toLowerCase()
}

export function getDashboardRefreshEventName(): string {
  return DASHBOARD_REFRESH_EVENT
}

export function getDashboardRefreshStorageKey(): string {
  return DASHBOARD_REFRESH_STORAGE_KEY
}

export function markTenantAsLive(tenantKey?: string | null): void {
  if (globalThis.window === undefined) return

  const key = normalizeTenantKey(tenantKey)
  if (!key) return

  localStorage.setItem(`${DASHBOARD_LIVE_TENANT_PREFIX}${key}`, "1")
}

export function hasTenantLiveData(tenantKey?: string | null): boolean {
  if (globalThis.window === undefined) return false

  const key = normalizeTenantKey(tenantKey)
  if (!key) return false

  return localStorage.getItem(`${DASHBOARD_LIVE_TENANT_PREFIX}${key}`) === "1"
}

export function announceDashboardDataRefresh(tenantKey?: string | null): void {
  if (globalThis.window === undefined) return

  const normalized = normalizeTenantKey(tenantKey)

  if (normalized) {
    markTenantAsLive(normalized)
  }

  globalThis.window.dispatchEvent(
    new CustomEvent(DASHBOARD_REFRESH_EVENT, {
      detail: {
        tenantKey: normalized || null,
        timestamp: Date.now(),
      },
    })
  )

  localStorage.setItem(
    DASHBOARD_REFRESH_STORAGE_KEY,
    JSON.stringify({
      tenantKey: normalized || null,
      timestamp: Date.now(),
    })
  )
}

export function parseDashboardRefreshPayload(raw: string | null): { tenantKey: string | null } | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as { tenantKey?: unknown }
    const tenantKey = typeof parsed.tenantKey === "string" ? parsed.tenantKey : ""
    return { tenantKey: normalizeTenantKey(tenantKey) || null }
  } catch {
    return null
  }
}
