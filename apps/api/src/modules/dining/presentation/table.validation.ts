import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../../../shared/http/api-response';

function ensureBodyObject(req: Request) {
  if (!req.body || typeof req.body !== 'object') {
    (req as Request & { body: Record<string, unknown> }).body = {};
  }
}

export function requireTableId(req: Request, res: Response, next: NextFunction) {
  const tableId = String(req.params.id || req.body?.tableId || req.query.tableId || '').trim();

  if (!tableId) {
    return sendError(res, 400, 'tableId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).tableId = tableId;
  return next();
}

export function requireTableStatus(req: Request, res: Response, next: NextFunction) {
  const status = String(req.body?.status || req.query.status || '').trim();

  if (!status) {
    return sendError(res, 400, 'status is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).status = status;
  return next();
}

export function requireWaiterId(req: Request, res: Response, next: NextFunction) {
  const waiterId = String(req.body?.waiterId || req.query.waiterId || '').trim();

  if (!waiterId) {
    return sendError(res, 400, 'waiterId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).waiterId = waiterId;
  return next();
}