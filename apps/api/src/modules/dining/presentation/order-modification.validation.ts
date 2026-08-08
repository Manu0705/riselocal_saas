import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../../../shared/http/api-response';

function ensureBodyObject(req: Request) {
  if (!req.body || typeof req.body !== 'object') {
    (req as Request & { body: Record<string, unknown> }).body = {};
  }
}

export function requireModificationOrderId(req: Request, res: Response, next: NextFunction) {
  const orderId = String(req.params.orderId || req.params.id || req.body?.orderId || req.query.orderId || '').trim();

  if (!orderId) {
    return sendError(res, 400, 'orderId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).orderId = orderId;
  return next();
}

export function requireModificationId(req: Request, res: Response, next: NextFunction) {
  const modificationId = String(req.params.modificationId || req.params.id || req.body?.modificationId || '').trim();

  if (!modificationId) {
    return sendError(res, 400, 'modificationId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).modificationId = modificationId;
  return next();
}

export function requireModificationReason(req: Request, res: Response, next: NextFunction) {
  const reason = String(req.body?.reason || '').trim();

  if (!reason) {
    return sendError(res, 400, 'reason is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).reason = reason;
  return next();
}

export function requireOrderItemId(req: Request, res: Response, next: NextFunction) {
  const orderItemId = String(req.params.orderItemId || req.body?.orderItemId || '').trim();

  if (!orderItemId) {
    return sendError(res, 400, 'orderItemId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).orderItemId = orderItemId;
  return next();
}
