import { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';

type RequestWithContext = Request & {
  requestId?: string;
  tenantSlug?: string;
  tenant?: { slug?: string };
  user?: { tenantId?: string };
};

function getTenantTag(req: Request): string {
  const request = req as RequestWithContext;

  if (request.tenantSlug) return request.tenantSlug;
  if (request.tenant?.slug) return request.tenant.slug;
  if (request.user?.tenantId) return request.user.tenantId;
  return 'n/a';
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const request = req as RequestWithContext;
  const requestId = req.headers['x-request-id'];
  request.requestId =
    typeof requestId === 'string' && requestId.length > 0 ? requestId : crypto.randomUUID();
  res.setHeader('x-request-id', request.requestId);

  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const log = {
      level: res.statusCode >= 500 ? 'error' : 'info',
      requestId: request.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      tenant: getTenantTag(req),
      action: `${req.method}:${req.path}`,
    };

    console.log(JSON.stringify(log));
  });

  next();
}
