import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../../../shared/http/api-response';

function ensureBodyObject(req: Request) {
  if (!req.body || typeof req.body !== 'object') {
    (req as Request & { body: Record<string, unknown> }).body = {};
  }
}

export function requireTransferSessionId(req: Request, res: Response, next: NextFunction) {
  const sessionId = String(req.params.sessionId || req.params.id || req.body?.sessionId || req.query.sessionId || '').trim();

  if (!sessionId) {
    return sendError(res, 400, 'sessionId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).sessionId = sessionId;
  return next();
}

export function requireTransferId(req: Request, res: Response, next: NextFunction) {
  const transferId = String(req.params.transferId || req.params.id || req.body?.transferId || '').trim();

  if (!transferId) {
    return sendError(res, 400, 'transferId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).transferId = transferId;
  return next();
}

export function requireDestinationTableId(req: Request, res: Response, next: NextFunction) {
  const destinationTableId = String(req.body?.destinationTableId || '').trim();

  if (!destinationTableId) {
    return sendError(res, 400, 'destinationTableId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).destinationTableId = destinationTableId;
  return next();
}

export function requireTransferReason(req: Request, res: Response, next: NextFunction) {
  const reason = String(req.body?.reason || '').trim();

  if (!reason) {
    return sendError(res, 400, 'reason is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).reason = reason;
  return next();
}
