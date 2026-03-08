# RiseLocal API Endpoints

Base URL for production testing:

`NEXT_PUBLIC_API_URL=https://api.riselocal.in`

Base URL for QA testing:

`NEXT_PUBLIC_API_URL=https://qa-api.riselocal.in`

## Health

- `GET /health`

## Auth

- `POST /api/auth/login`

## Tenant

- `POST /api/tenants`
- `GET /api/tenants`
- `GET /api/tenants/slug/:slug`

## Leads (tenant ID scoped)

- `POST /api/tenants/:tenantId/leads`
- `PATCH /api/tenants/:tenantId/leads/:id/status`
- `GET /api/tenants/:tenantId/leads`

## Leads (tenant slug scoped)

- `POST /api/tenant/:tenantSlug/leads`
- `PATCH /api/tenant/:tenantSlug/leads/:id/status`
- `GET /api/tenant/:tenantSlug/leads`

## Feedback (tenant ID scoped)

- `POST /api/tenants/:tenantId/feedback`
- `GET /api/tenants/:tenantId/feedback`
- `GET /api/tenants/:tenantId/feedback/pending`

## Feedback (tenant slug scoped)

- `POST /api/tenant/:tenantSlug/feedback`
- `GET /api/tenant/:tenantSlug/feedback`
- `GET /api/tenant/:tenantSlug/feedback/pending`

## Feedback Moderation

- `PATCH /api/feedback/:id/approve`
- `PATCH /api/feedback/:id/reject`

## Required Headers for Multi-Tenant Context

Send at least one:

- `x-tenant-slug: abc-cafe`
- query `?tenantSlug=abc-cafe`

Optional for compatibility:

- `x-tenant-domain: abc-cafe.riselocal.in`

## Auth Header

For protected routes:

- `Authorization: Bearer <jwt_token>`
