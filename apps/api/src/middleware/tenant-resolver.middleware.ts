import { Request, Response, NextFunction } from 'express';
import { PrismaTenantRepository } from '../modules/tenant/infrastructure/tenant.prisma.repository';
import { GetTenantByDomainUseCase } from '../modules/tenant/application/get-tenant-by-domain.usecase';

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
      return res.status(400).json({
        success: false,
        message: 'x-tenant-domain or x-tenant-slug header is required',
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
    return res.status(404).json({
      success: false,
      message: error.message || 'Tenant not found',
    });
  }
}
