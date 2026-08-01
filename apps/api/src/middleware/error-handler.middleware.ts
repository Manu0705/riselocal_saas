import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error';
import { sendError } from '../shared/http/api-response';

function codeFromStatus(status: number): string {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'INTERNAL_ERROR';
  return 'VALIDATION_ERROR';
}

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

    return sendError(res, err.statusCode, err.message, {
      code: codeFromStatus(err.statusCode),
      req: request,
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

  return sendError(res, 500, 'Internal Server Error', {
    code: 'INTERNAL_ERROR',
    req: request,
  });
}
