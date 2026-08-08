import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../../../shared/http/api-response';

function ensureBodyObject(req: Request) {
  if (!req.body || typeof req.body !== 'object') {
    (req as Request & { body: Record<string, unknown> }).body = {};
  }
}

export function requireTableIds(req: Request, res: Response, next: NextFunction) {
  const tables = Array.isArray(req.body?.tables)
    ? req.body.tables.filter((value: unknown) => typeof value === 'string' && value.trim())
    : [];

  if (!tables.length) {
    return sendError(res, 400, 'tables is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).tables = tables;
  return next();
}

export function requireMergeReason(req: Request, res: Response, next: NextFunction) {
  const reason = String(req.body?.reason || '').trim();
  if (!reason) {
    return sendError(res, 400, 'reason is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).reason = reason;
  return next();
}

export function requireMergeId(req: Request, res: Response, next: NextFunction) {
  const mergeId = String(req.params.mergeId || req.body?.mergeId || '').trim();
  if (!mergeId) {
    return sendError(res, 400, 'mergeId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).mergeId = mergeId;
  return next();
}

export function requireGroupId(req: Request, res: Response, next: NextFunction) {
  const groupId = String(req.params.groupId || req.body?.groupId || '').trim();
  if (!groupId) {
    return sendError(res, 400, 'groupId is required', { code: 'VALIDATION_ERROR', req });
  }

  ensureBodyObject(req);
  (req.body as Record<string, unknown>).groupId = groupId;
  return next();
}
