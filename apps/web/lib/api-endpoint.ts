const DEFAULT_PRIMARY_API_BASE = "https://api.riselocal.in"
const DEFAULT_FALLBACK_API_BASE = "https://riselocal-api.onrender.com"

function normalizeBase(base: string): string {
  return String(base).replace(/\/+$/, "")
}

export function normalizeApiPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return normalizedPath.toLowerCase().startsWith("/api")
    ? normalizedPath
    : `/api${normalizedPath}`
}

export function buildBrowserApiUrl(path: string): string {
  return normalizeApiPath(path)
}

export function getApiBaseCandidates(): string[] {
  const configuredBase =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API)) ||
    DEFAULT_PRIMARY_API_BASE

  return [configuredBase, DEFAULT_FALLBACK_API_BASE]
    .map((entry) => normalizeBase(entry))
    .filter((entry, index, items) => Boolean(entry) && items.indexOf(entry) === index)
}

export function buildUpstreamApiUrl(base: string, path: string): string {
  return `${normalizeBase(base)}${normalizeApiPath(path)}`
}