import { NextFunction, Request, Response } from 'express';

type RequestWithTenantAccess = Request & {
  tenant?: { id: string };
  user?: { tenantId: string; role: string };
};

function isPrivilegedRole(role?: string): boolean {
  const normalized = String(role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'super_admin';
}

export function tenantAccessMiddleware(req: Request, res: Response, next: NextFunction) {
  const request = req as RequestWithTenantAccess;
  const routeTenantId =
    typeof request.params.tenantId === 'string' ? request.params.tenantId : undefined;
  const resolvedTenantId = request.tenant?.id;
  const userTenantId = request.user?.tenantId;

  if (routeTenantId && resolvedTenantId && routeTenantId !== resolvedTenantId) {
    return res.status(403).json({
      success: false,
      message: 'Tenant route mismatch',
    });
  }

  const effectiveTenantId = routeTenantId ?? resolvedTenantId;

  if (
    !isPrivilegedRole(request.user?.role) &&
    userTenantId &&
    effectiveTenantId &&
    userTenantId !== effectiveTenantId
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied for this tenant',
    });
  }

  if (!request.params.tenantId && resolvedTenantId) {
    request.params.tenantId = resolvedTenantId;
  }

  return next();
}
