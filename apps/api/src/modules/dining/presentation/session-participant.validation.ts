import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../../../shared/http/api-response';

function ensureBodyObject(req: Request) {
  if (!req.body || typeof req.body !== 'object') {
    (req as Request & { body: Record<string, unknown> }).body = {};
  }
}

export function requireParticipantSessionId(req: Request, res: Response, next: NextFunction) {
  const sessionId = String(req.params.sessionId || req.body?.sessionId || req.query.sessionId || '').trim();

  if (!sessionId) {
    return sendError(res, 400, 'sessionId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).sessionId = sessionId;
  return next();
}

export function requireParticipantType(req: Request, res: Response, next: NextFunction) {
  const participantType = String(req.body?.type || req.body?.participantType || '').trim();

  if (!participantType) {
    return sendError(res, 400, 'type is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).participantType = participantType;
  return next();
}

export function requireParticipantId(req: Request, res: Response, next: NextFunction) {
  const participantId = String(req.params.participantId || req.body?.participantId || req.query.participantId || '').trim();

  if (!participantId) {
    return sendError(res, 400, 'participantId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).participantId = participantId;
  return next();
}
