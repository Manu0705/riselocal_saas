import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../../../shared/http/api-response';

function ensureBodyObject(req: Request) {
  if (!req.body || typeof req.body !== 'object') {
    (req as Request & { body: Record<string, unknown> }).body = {};
  }
}

export function requireCartSessionId(req: Request, res: Response, next: NextFunction) {
  const sessionId = String(req.params.sessionId || req.body?.sessionId || req.query.sessionId || '').trim();

  if (!sessionId) {
    return sendError(res, 400, 'sessionId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).sessionId = sessionId;
  return next();
}

export function requireCartItemId(req: Request, res: Response, next: NextFunction) {
  const itemId = String(req.params.itemId || req.body?.itemId || req.query.itemId || '').trim();

  if (!itemId) {
    return sendError(res, 400, 'itemId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).itemId = itemId;
  return next();
}

export function requireCartMenuItemId(req: Request, res: Response, next: NextFunction) {
  const menuItemId = String(req.body?.menuItemId || '').trim();

  if (!menuItemId) {
    return sendError(res, 400, 'menuItemId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).menuItemId = menuItemId;
  return next();
}

export function requireCartQuantity(req: Request, res: Response, next: NextFunction) {
  const quantity = Number(req.body?.quantity);

  if (!Number.isInteger(quantity)) {
    return sendError(res, 400, 'quantity is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).quantity = quantity;
  return next();
}