# Deployment Architecture

## Domains

- Marketing: `https://riselocal.in`
- Tenants: `https://<tenantSlug>.riselocal.in`
- API: `https://api.riselocal.in`
- QA: `https://qa.riselocal.in`
- QA API: `https://qa-api.riselocal.in`

## Frontend (Vercel)

- Project root: `apps/web`
- Environment variables:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_ENV`
- Subdomain tenant routing handled by `apps/web/middleware.ts`.

## Backend (Render)

- Start command: `pnpm run start:api`
- Health endpoint: `/health`
- Environment variables:
  - `APP_ENV`
  - `NODE_ENV`
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `FRONTEND_URL`

## Environments

- `development` via `.env.development`
- `qa` via `.env.qa`
- `production` via `.env.production`

API env loading is centralized in `apps/api/src/config/env.ts`.
