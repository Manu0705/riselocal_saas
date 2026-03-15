import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  void next;

  const request = req as Request & {
    requestId?: string;
    tenantSlug?: string;
    tenant?: { slug?: string };
    user?: { tenantId?: string };
  };

  const tenant = request.tenantSlug || request.tenant?.slug || request.user?.tenantId || 'n/a';

  if (err instanceof AppError) {
    console.error(
      JSON.stringify({
        level: 'warn',
        requestId: request.requestId,
        tenant,
        message: err.message,
        statusCode: err.statusCode,
      }),
    );

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      requestId: request.requestId,
    });
  }

  const error = err instanceof Error ? err : new Error('Unhandled error');

  console.error(
    JSON.stringify({
      level: 'error',
      requestId: request.requestId,
      tenant,
      message: error.message,
      stack: error.stack,
    }),
  );

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    requestId: request.requestId,
  });
}
