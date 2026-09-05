import { NextRequest, NextResponse } from 'next/server';

// Reserved routes that should not be treated as tenant slugs
const RESERVED = new Set([
  'api',
  '_next',
  'dashboard',
  'admin',
  'login',
  'favicon.ico',
  'qa',
  'www',
  'wp-admin',
  'xmlrpc',
  'analytics',
  'leads',
  'feedback',
  'tenants',
  'followups',
  'settings',
]);

const TENANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Normalize and extract host from request
function normalizeHost(host: string): string {
  return host.split(',')[0].trim().toLowerCase().split(':')[0];
}

// Extract tenant slug from subdomain
function extractSubdomainSlug(host: string): string | null {
  const normalized = normalizeHost(host);

  // Map of domain patterns to their minimum part count
  const domainPatterns = [
    { suffix: '.localhost', minParts: 2 },
    { suffix: '.qa.riselocal.in', minParts: 4 },
    { suffix: '.riselocal.in', minParts: 3 },
  ];

  for (const { suffix, minParts } of domainPatterns) {
    if (normalized.endsWith(suffix)) {
      const parts = normalized.split('.');
      if (parts.length >= minParts) {
        const slug = parts[0];
        // Treat "www" and other reserved keywords as root domain, not a tenant
        return slug && TENANT_SLUG_PATTERN.test(slug) && !RESERVED.has(slug) ? slug : null;
      }
    }
  }

  return null;
}

// Extract tenant slug from URL path
function extractPathSlug(pathname: string): string | null {
  const segments = pathname.split('/').filter((s) => s.length > 0);
  if (segments.length === 0) return null;

  const firstSegment = segments[0];
  return RESERVED.has(firstSegment) || !TENANT_SLUG_PATTERN.test(firstSegment)
    ? null
    : firstSegment;
}

// Check if path is an asset or should be ignored
function shouldIgnore(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.') // static files
  );
}

// Check if path is a reserved route
function isReservedPath(pathname: string): boolean {
  const firstSegment = pathname
    .split('/')
    .filter(Boolean)
    .find(() => true);
  return firstSegment ? RESERVED.has(firstSegment) : false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  const subdomainSlug = extractSubdomainSlug(host);
  const pathSlug = extractPathSlug(pathname);

  // Ignore assets and API routes
  if (shouldIgnore(pathname)) {
    return NextResponse.next();
  }

  // On tenant subdomains, app-level routes must pass through unchanged.
  // - /login  : tenant is detected client-side from hostname (no hydration mismatch)
  // - /dashboard and all sub-routes: authenticated app, not tenant-scoped paths
  // These must NOT get the /<slug>/... rewrite that public pages receive.
  if (subdomainSlug && (pathname === '/login' || pathname.startsWith('/dashboard'))) {
    return NextResponse.next();
  }

  // Keep reserved routes untouched on root domain.
  // On tenant subdomains we still need rewrites for paths like /feedback.
  if (!subdomainSlug && isReservedPath(pathname)) {
    return NextResponse.next();
  }

  // Case 1: Subdomain is present (e.g., bavani.riselocal.in)
  if (subdomainSlug) {
    // Case 1a: Root path (e.g., bavani.riselocal.in/)
    if (pathname === '/' || pathname === '') {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/${subdomainSlug}`;
      return NextResponse.rewrite(rewriteUrl);
    }

    // Case 1b: Path matches subdomain (e.g., bavani.riselocal.in/bavani)
    if (pathSlug === subdomainSlug) {
      return NextResponse.next();
    }

    // Case 1c: Path is different from subdomain (e.g., bavani.riselocal.in/contact)
    // This is valid - append subdomain to path
    if (pathSlug !== subdomainSlug) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/${subdomainSlug}${pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // Case 2: No subdomain, path-based routing (e.g., riselocal.in/bavani)
  if (!subdomainSlug && pathSlug) {
    // Let Next.js handle the route - tenant validation happens in page.tsx
    return NextResponse.next();
  }

  // Case 3: Root domain with no tenant (e.g., riselocal.in or www.riselocal.in)
  // Let it pass through - you can add a landing page at app/page.tsx
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
