import { Request, Response, NextFunction } from 'express';
import { PrismaTenantRepository } from '../modules/tenant/infrastructure/tenant.prisma.repository';
import { GetTenantByDomainUseCase } from '../modules/tenant/application/get-tenant-by-domain.usecase';
import { sendError } from '../shared/http/api-response';

/* =========================================
   Middleware
========================================= */

const repository = new PrismaTenantRepository();
const useCase = new GetTenantByDomainUseCase(repository);

export async function tenantResolver(req: Request, res: Response, next: NextFunction) {
  try {
    const slugHeader = req.headers['x-tenant-slug'];
    const domainHeader = req.headers['x-tenant-domain'];

    if (
      (!domainHeader || typeof domainHeader !== 'string') &&
      (!slugHeader || typeof slugHeader !== 'string')
    ) {
      return sendError(res, 400, 'x-tenant-domain or x-tenant-slug header is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    const tenant = await useCase.execute({
      domain: typeof domainHeader === 'string' ? domainHeader : undefined,
      slug: typeof slugHeader === 'string' ? slugHeader : undefined,
    });

    const request = req as Request & {
      tenantSlug?: string;
      tenant?: unknown;
    };

    request.tenantSlug = tenant.slug;
    request.tenant = tenant;

    next();
  } catch (error: any) {
    return sendError(res, 404, error.message || 'Tenant not found', {
      code: 'NOT_FOUND',
      req,
    });
  }
}
