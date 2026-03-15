# Pre-Publish Deployment Checklist

✅ **Build Verification**

- [x] Backend (API) build passes: `pnpm run build:api`
- [x] Frontend (Web) build passes: `pnpm run build:web`
- [x] Full workspace build passes: `pnpm run build`

✅ **Configuration Alignment**

- [x] Environment files use placeholders (no real credentials)
- [x] `.gitignore` excludes all `.env*` files
- [x] `.env.example` template created for developers
- [x] `render.yaml` configured for prod + QA environments
- [x] QA API start command respects runtime environment
- [x] Root scripts (`start:api`) respect APP_ENV/NODE_ENV

✅ **Multi-Tenant Architecture**

- [x] Slug-based routing implemented (subdomain/header/query)
- [x] Tenant resolution middleware active in API
- [x] Tenant access guards protect cross-tenant data leakage
- [x] Frontend middleware rewrites slugs correctly
- [x] API routes accept `/api/tenants/:slug/...` patterns

✅ **Security Hardening**

- [x] CORS configured with explicit allowlist (includes Vercel previews)
- [x] Helmet middleware active (CSP, XSS, etc.)
- [x] Rate limiting enabled (100 req/15min per IP)
- [x] Request ID tracking for observability
- [x] Sanitization middleware prevents injection
- [x] Centralized error handling (no stack traces in prod)

✅ **Deployment Documentation**

- [x] `README.md` includes exact Vercel + Render dashboard settings
- [x] Environment variable reference documented
- [x] DNS/domain configuration guide included
- [x] Health check endpoints documented (`/api/health`)
- [x] Verification checklist for post-deploy validation

✅ **API Testing & Docs**

- [x] Endpoint inventory created (`docs/api-endpoints.md`)
- [x] Postman collection available (`postman-collection.json`)
- [x] Smoke test script created (`scripts/api-smoke-test.sh`)

✅ **Frontend Fixes**

- [x] Suspense boundaries added for `useSearchParams()` usage
- [x] Dynamic rendering enabled for dashboard routes
- [x] React type dependencies aligned (18.x)
- [x] Workspace dependency boundaries corrected

✅ **Operational Readiness**

- [x] Production, QA, and development configs separated
- [x] Neon Postgres connection strings templated
- [x] Worker service patterns documented (BullMQ + Redis)
- [x] Database migrations ready in `packages/database/prisma/migrations`

---

## Final Actions Before GitHub Publish

1. **Initialize Git repository** (if not already done):

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Multi-tenant SaaS platform with Vercel/Render deployment"
   ```

2. **Create GitHub repository** and push:

   ```bash
   git remote add origin https://github.com/<your-org>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```

3. **Set up Vercel project**:
   - Import from GitHub
   - Root directory: `apps/web`
   - Framework: Next.js
   - Add environment variables from `README.md` → Vercel section

4. **Set up Render services**:
   - Connect GitHub repo
   - Render will auto-detect `render.yaml`
   - Add environment variables for both prod and QA services
   - Or manually create services using specs from `README.md`

5. **Configure Neon Postgres**:
   - Create separate databases for prod/QA
   - Update `DATABASE_URL` in respective Render environment variables

6. **Deploy and verify**:
   - Both services deploy automatically on push to `main`
   - Run health checks: `https://api.riselocal.in/api/health`
   - Test tenant resolution with subdomain access
   - Verify CORS with frontend domain
   - Check logs for errors

---

## ⚠️ Post-Publish Security Actions

**IMMEDIATELY after deploying to production:**

1. **Rotate all secrets in production environment**:
   - Generate new `JWT_SECRET` (use `openssl rand -base64 32`)
   - Update in Render production service environment variables
   - Do NOT commit real secrets to repo

2. **Enable Render deployment notifications** (Slack/email)

3. **Set up monitoring**:
   - Configure Render log drains
   - Set up uptime monitoring (UptimeRobot, Better Uptime, etc.)

4. **Review and lock down**:
   - Audit CORS allowlist to ensure only necessary origins
   - Verify rate limits are appropriate for expected traffic
   - Check that error responses don't leak sensitive info

---

**Status**: ✅ All systems aligned for GitHub publish and production deployment.
