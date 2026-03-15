# RiseLocal Deployment Runbook

This section contains exact Vercel + Render dashboard settings for production and QA.

## Vercel Dashboard Settings (Frontend)

Create one Vercel project for `apps/web`.

- Project Name: `riselocal-web`
- Framework Preset: `Next.js`
- Root Directory: `apps/web`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm --filter @saas/web build`
- Output Directory: `.next`
- Node.js Version: `20.x`

### Vercel Environment Variables

Set in `Project Settings -> Environment Variables`:

Production:

- `NEXT_PUBLIC_API_URL=https://api.riselocal.in`
- `NEXT_PUBLIC_ENV=production`

Preview (QA branch deployments):

- `NEXT_PUBLIC_API_URL=https://qa-api.riselocal.in`
- `NEXT_PUBLIC_ENV=qa`

Development:

- `NEXT_PUBLIC_API_URL=http://localhost:4000`
- `NEXT_PUBLIC_ENV=development`

### Vercel Domains

Add in `Project Settings -> Domains`:

- `riselocal.in`
- `qa.riselocal.in`
- `*.riselocal.in`
- `*.qa.riselocal.in`

Notes:

- Wildcard domains require appropriate Vercel plan support.
- The app already contains `apps/web/middleware.ts` for tenant subdomain routing.

## Render Dashboard Settings (Backend API)

Create two Render web services from this repo root.

### Service 1: Production API

- Service Name: `riselocal-api`
- Runtime: `Node`
- Branch: `main` (or your production branch)
- Root Directory: repo root
- Build Command: `pnpm install --frozen-lockfile && pnpm run build:api`
- Start Command: `pnpm run start:api`
- Health Check Path: `/health`
- Auto Deploy: `On`

Environment Variables:

- `APP_ENV=production`
- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=<your_neon_production_url>`
- `JWT_SECRET=<strong_secret>`
- `FRONTEND_URL=https://riselocal.in,https://qa.riselocal.in,https://*.vercel.app`
- `CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>`
- `CLOUDINARY_API_KEY=<your_cloudinary_api_key>`
- `CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>`

Custom Domain:

- `api.riselocal.in`

### Service 2: QA API

- Service Name: `riselocal-api-qa`
- Runtime: `Node`
- Branch: your QA branch (for example `qa`)
- Root Directory: repo root
- Build Command: `pnpm install --frozen-lockfile && pnpm run build:api`
- Start Command: `pnpm run start:api`
- Health Check Path: `/health`
- Auto Deploy: `On`

Environment Variables:

- `APP_ENV=qa`
- `NODE_ENV=development`
- `PORT=4000`
- `DATABASE_URL=<your_neon_qa_url>`
- `JWT_SECRET=<qa_secret>`
- `FRONTEND_URL=https://qa.riselocal.in,https://*.vercel.app`
- `CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>`
- `CLOUDINARY_API_KEY=<your_cloudinary_api_key>`
- `CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>`

Custom Domain:

- `qa-api.riselocal.in`

## Neon Database Setup

Create separate Neon projects/databases:

- `riselocal-prod`
- `riselocal-qa`

Then map URLs:

- production `DATABASE_URL` -> prod Neon DB
- qa `DATABASE_URL` -> qa Neon DB

## DNS Records (Domain Provider)

Create these records in your DNS provider for `riselocal.in`:

Frontend to Vercel:

- `A` record: `@` -> `76.76.21.21`
- `CNAME` record: `qa` -> `cname.vercel-dns.com`
- `CNAME` record: `*` -> `cname.vercel-dns.com`
- `CNAME` record: `*.qa` -> `cname.vercel-dns.com`

Backend to Render:

- `CNAME` record: `api` -> `<render-production-service>.onrender.com`
- `CNAME` record: `qa-api` -> `<render-qa-service>.onrender.com`

## Required Verification Checklist

After configuration, verify:

- `https://api.riselocal.in/health` returns `{ "status": "ok" }`
- `https://qa-api.riselocal.in/health` returns `{ "status": "ok" }`
- `https://riselocal.in` loads marketing site
- `https://abc-cafe.riselocal.in` resolves tenant storefront
- `https://qa.riselocal.in` points to QA frontend
- `https://abc-cafe.qa.riselocal.in` resolves QA tenant storefront

## API Testing

- Postman collection: `postman_collection_riselocal.json`
- Endpoint list: `API_ENDPOINTS.md`
- CLI smoke test: `scripts/test-api.sh`

Example:

```bash
JWT=<token> TENANT_SLUG=abc-cafe bash scripts/test-api.sh https://api.riselocal.in
JWT=<token> TENANT_SLUG=abc-cafe bash scripts/test-api.sh https://qa-api.riselocal.in
```
