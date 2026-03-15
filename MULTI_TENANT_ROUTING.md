# Multi-Tenant Routing System

## Overview

RiseLocal implements a secure multi-tenant SaaS routing system where tenants can be accessed via:

1. **Path-based routing**: `https://riselocal.in/{tenantSlug}`
2. **Subdomain routing**: `https://{tenantSlug}.riselocal.in`

## Architecture

### Main Domains

The following domains serve the main application:

- `https://riselocal.in` - Main landing page
- `https://www.riselocal.in` - Treated as root domain (www is not a tenant)
- `www.riselocal.in` - Same as above

### Tenant Access Patterns

Tenants are created by admins in the admin dashboard and stored in the `tenants` table with a unique `slug`.

#### Example: Tenant with slug = "bavani"

**Both access methods point to the same tenant:**

1. Path-based: `https://riselocal.in/bavani`
2. Subdomain: `https://bavani.riselocal.in`

#### Subdomain Routes

When accessing via subdomain:

- `https://bavani.riselocal.in` → rewrites to `/{bavani}`
- `https://bavani.riselocal.in/contact` → rewrites to `/{bavani}/contact`
- `https://bavani.riselocal.in/feedback` → rewrites to `/{bavani}/feedback`

### Tenant Validation

All tenant requests are validated against the database:

```typescript
const tenant = await prisma.tenant.findUnique({
  where: { slug: tenantSlug },
});

if (!tenant) {
  notFound(); // Returns 404
}
```

**Only admin-created tenants are accessible.** Any undefined tenant slug will return 404.

## Security Rules

### Invalid Patterns (All return 404)

The following URL patterns are blocked:

1. **www subdomain with tenant**: `https://www.bavani.riselocal.in` ❌
2. **Invalid tenant slugs**:
   - `https://wrongTenant.riselocal.in` ❌
   - `https://riselocal.in/wrongTenant` ❌
3. **Empty subdomain**: `https://.tenant.riselocal.in/*` ❌
4. **Invalid paths on tenant subdomain**: `https://bavani.riselocal.in/wrongSlug` ❌
5. **Mismatched subdomain/path**: `https://bavani.riselocal.in/bhavani` ❌

### Reserved Routes

The following routes are reserved and cannot be used as tenant slugs:

- `dashboard`
- `admin`
- `analytics`
- `leads`
- `feedback`
- `tenants`
- `followups`
- `settings`
- `login`
- `api`
- `_next`
- `www`
- `qa`

### Slug Consistency

If both subdomain and path are present, they must match:

✅ **Valid**: `bavani.riselocal.in/bavani`
❌ **Invalid**: `bavani.riselocal.in/bhavani` → Returns 404

## Implementation Details

### Middleware (`apps/web/middleware.ts`)

The middleware handles:

1. **Subdomain Detection**: Extracts tenant slug from subdomain
2. **Path Detection**: Extracts tenant slug from URL path
3. **URL Rewriting**: Rewrites subdomain requests to path-based routes internally
4. **Reserved Route Protection**: Ignores dashboard, admin, login, API routes
5. **Asset Handling**: Bypasses middleware for `_next/*`, static files, etc.

### Tenant Validation (`apps/web/app/(public)/[tenantSlug]/`)

Tenant validation happens in two places:

1. **Layout (`layout.tsx`)**: Validates tenant and returns 404 if not found
2. **Page (`page.tsx`)**: Additional validation at page level

Both use the `getTenant()` function which:

- Queries the API: `GET /api/tenants/slug/{slug}`
- Returns `null` if tenant doesn't exist
- Triggers 404 page via `notFound()`

### API Endpoint (`apps/api/src/modules/tenant/presentation/tenant.routes.ts`)

```typescript
GET /api/tenants/slug/:slug

// Returns 404 if tenant not in database
```

## Development Setup

### Localhost Testing

For local development, use the following patterns:

1. **Path-based**: `http://localhost:3000/bavani`
2. **Subdomain**: `http://bavani.localhost:3000`

Ensure you have a tenant with slug `bavani` in your database.

### Creating a Tenant

Tenants are created via the admin dashboard or API:

```bash
POST /api/tenants
{
  "name": "Bavani Business",
  "slug": "bavani",
  "domain": null
}
```

## URL Examples

### Valid URLs ✅

| URL                                   | Description                 |
| ------------------------------------- | --------------------------- |
| `https://riselocal.in`                | Main landing page           |
| `https://www.riselocal.in`            | Main landing page           |
| `https://riselocal.in/bavani`         | Path-based tenant access    |
| `https://bavani.riselocal.in`         | Subdomain tenant access     |
| `https://bavani.riselocal.in/contact` | Tenant contact page         |
| `https://riselocal.in/bavani/contact` | Tenant contact page         |
| `https://riselocal.in/dashboard`      | Dashboard (reserved route)  |
| `https://riselocal.in/login`          | Login page (reserved route) |

### Invalid URLs ❌

| URL                                   | Reason                             |
| ------------------------------------- | ---------------------------------- |
| `https://www.bavani.riselocal.in`     | www + tenant subdomain not allowed |
| `https://invalidtenant.riselocal.in`  | Tenant doesn't exist in database   |
| `https://riselocal.in/invalidtenant`  | Tenant doesn't exist in database   |
| `https://bavani.riselocal.in/bhavani` | Subdomain/path mismatch            |
| `https://dashboard.riselocal.in`      | Reserved slug used as tenant       |

## File Structure

```
apps/web/
├── app/
│   ├── (public)/
│   │   └── [tenantSlug]/           # Tenant routes
│   │       ├── layout.tsx          # Tenant validation
│   │       ├── page.tsx            # Tenant home page
│   │       ├── contact/
│   │       ├── feedback/
│   │       └── review/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main landing page
│   └── not-found.tsx               # 404 page
├── middleware.ts                   # Routing & subdomain handling
└── lib/
    └── tenant-resolver.ts          # Tenant fetching logic
```

## Testing Checklist

- [ ] Main domain loads: `https://riselocal.in`
- [ ] WWW domain loads: `https://www.riselocal.in`
- [ ] Path-based tenant: `https://riselocal.in/bavani`
- [ ] Subdomain tenant: `https://bavani.riselocal.in`
- [ ] Invalid tenant returns 404: `https://wrongtenant.riselocal.in`
- [ ] Invalid path returns 404: `https://riselocal.in/wrongtenant`
- [ ] www + tenant blocked: `https://www.bavani.riselocal.in`
- [ ] Mismatched slug blocked: `https://bavani.riselocal.in/bhavani`
- [ ] Reserved routes work: `https://riselocal.in/dashboard`
- [ ] Admin dashboard: `https://riselocal.in/admin`
- [ ] Login page: `https://riselocal.in/login`

## Notes

- Tenant validation is strict - only admin-created tenants are accessible
- All tenant lookups are case-insensitive and trimmed
- Subdomain routing uses internal URL rewriting (transparent to Next.js)
- 404 pages are automatically shown for invalid tenants
- Reserved routes are protected at multiple levels (middleware + validator)
