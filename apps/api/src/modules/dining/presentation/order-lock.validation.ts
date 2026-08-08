import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../../../shared/http/api-response';

function ensureBodyObject(req: Request) {
  if (!req.body || typeof req.body !== 'object') {
    (req as Request & { body: Record<string, unknown> }).body = {};
  }
}

export function requireOrderId(req: Request, res: Response, next: NextFunction) {
  const orderId = String(req.params.orderId || req.body?.orderId || req.query.orderId || '').trim();

  if (!orderId) {
    return sendError(res, 400, 'orderId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).orderId = orderId;
  return next();
}

export function requireOrderVersion(req: Request, res: Response, next: NextFunction) {
  const version = Number(req.body?.version);

  if (!Number.isInteger(version) || version < 0) {
    return sendError(res, 400, 'version is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).version = version;
  return next();
}
