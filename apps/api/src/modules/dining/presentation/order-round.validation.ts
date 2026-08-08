import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../../../shared/http/api-response';

function ensureBodyObject(req: Request) {
  if (!req.body || typeof req.body !== 'object') {
    (req as Request & { body: Record<string, unknown> }).body = {};
  }
}

export function requireOrderSessionId(req: Request, res: Response, next: NextFunction) {
  const sessionId = String(req.params.sessionId || req.body?.sessionId || req.query.sessionId || '').trim();

  if (!sessionId) {
    return sendError(res, 400, 'sessionId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).sessionId = sessionId;
  return next();
}

export function requireOrderRoundId(req: Request, res: Response, next: NextFunction) {
  const roundId = String(req.params.roundId || req.body?.roundId || req.query.roundId || '').trim();

  if (!roundId) {
    return sendError(res, 400, 'roundId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).roundId = roundId;
  return next();
}