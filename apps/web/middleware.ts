import { NextRequest, NextResponse } from "next/server"

const RESERVED = new Set(["api", "_next", "dashboard", "login", "favicon.ico", "qa", "www"])

function normalizeHost(host: string): string {
  return host.split(",")[0].trim().toLowerCase().split(":")[0]
}

function inferTenantSlug(host: string): string | null {
  const normalized = normalizeHost(host)

  if (normalized.endsWith(".localhost")) {
    const [slug] = normalized.split(".")
    return RESERVED.has(slug) ? null : slug
  }

  if (normalized.endsWith(".qa.riselocal.in")) {
    const [slug] = normalized.split(".")
    return RESERVED.has(slug) ? null : slug
  }

  if (normalized.endsWith(".riselocal.in")) {
    const [slug] = normalized.split(".")
    return RESERVED.has(slug) ? null : slug
  }

  return null
}

function isAssetPath(pathname: string): boolean {
  return pathname.startsWith("/_next") || pathname.includes(".")
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isAssetPath(pathname) || pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? ""
  const tenantSlug = inferTenantSlug(host)

  if (!tenantSlug) {
    return NextResponse.next()
  }

  if (pathname === "/") {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = `/${tenantSlug}`
    return NextResponse.rewrite(rewriteUrl)
  }

  const pathRoot = pathname.split("/").find((segment) => segment.length > 0) || ""

  if (pathRoot === tenantSlug || RESERVED.has(pathRoot)) {
    return NextResponse.next()
  }

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = `/${tenantSlug}${pathname}`
  return NextResponse.rewrite(rewriteUrl)
}

export const config = {
  matcher: ["/:path*"],
}
