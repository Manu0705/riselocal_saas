import { NextFunction, Request, Response } from "express"
import { PrismaTenantRepository } from "../modules/tenant/infrastructure/tenant.prisma.repository"

type RequestWithTenant = Request & {
  tenantSlug?: string
  tenant?: {
    id: string
    slug: string
    name: string
    domain?: string | null
  }
}

const repository = new PrismaTenantRepository()

const RESERVED_SUBDOMAINS = new Set(["api", "qa", "www", "localhost"])

function firstHostLabel(hostname: string): string | null {
  const [first] = hostname.split(".")
  if (!first || RESERVED_SUBDOMAINS.has(first)) {
    return null
  }
  return first
}

function inferTenantSlugFromHost(req: Request): string | null {
  const hostHeader = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .split(":")[0]

  if (!hostHeader) return null

  if (hostHeader.endsWith(".localhost")) {
    return firstHostLabel(hostHeader)
  }

  if (hostHeader.endsWith(".qa.riselocal.in")) {
    return firstHostLabel(hostHeader)
  }

  if (hostHeader.endsWith(".riselocal.in")) {
    return firstHostLabel(hostHeader)
  }

  return null
}

function getSlugCandidate(req: Request): string | null {
  const fromParams = typeof req.params.tenantSlug === "string" ? req.params.tenantSlug : null
  if (fromParams) return fromParams

  const fromHeader = typeof req.headers["x-tenant-slug"] === "string" ? req.headers["x-tenant-slug"] : null
  if (fromHeader) return fromHeader

  const queryValue = req.query.tenantSlug ?? req.query.tenant
  if (typeof queryValue === "string" && queryValue.length > 0) {
    return queryValue
  }

  return inferTenantSlugFromHost(req)
}

export async function tenantContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  const request = req as RequestWithTenant
  const slugCandidate = getSlugCandidate(req)

  if (!slugCandidate) {
    return next()
  }

  const slug = slugCandidate.trim().toLowerCase()

  const tenant = await repository.findBySlug(slug)
  if (!tenant) {
    return next()
  }

  const dto = tenant.toJSON()
  request.tenantSlug = dto.slug
  request.tenant = {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    domain: dto.domain ?? null,
  }

  if (!req.params.tenantId) {
    req.params.tenantId = dto.id
  }

  return next()
}
