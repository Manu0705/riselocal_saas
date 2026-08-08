import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../../../shared/http/api-response';

export function requireSessionTokenTenantAndLocation(req: Request, res: Response, next: NextFunction) {
  const tenantId = String(req.params.tenantId || req.tenant?.id || req.user?.tenantId || '').trim();
  const locationId = String(req.body?.locationId || req.query.locationId || req.headers['x-location-id'] || '').trim();

  if (!tenantId) {
    return sendError(res, 400, 'tenantId is required', { code: 'VALIDATION_ERROR', req });
  }

  if (!locationId) {
    return sendError(res, 400, 'locationId is required', { code: 'VALIDATION_ERROR', req });
  }

  req.params.tenantId = tenantId;

  if (!req.body || typeof req.body !== 'object') {
    (req as Request & { body: Record<string, unknown> }).body = {};
  }

  (req.body as Record<string, unknown>).locationId = locationId;
  return next();
}

export function requireSessionId(req: Request, res: Response, next: NextFunction) {
  const sessionId = String(req.body?.sessionId || req.query.sessionId || '').trim();
  if (!sessionId) {
    return sendError(res, 400, 'sessionId is required', { code: 'VALIDATION_ERROR', req });
  }

  req.body.sessionId = sessionId;
  return next();
}

export function requireToken(req: Request, res: Response, next: NextFunction) {
  const token = String(req.body?.token || req.query.token || '').trim();
  if (!token) {
    return sendError(res, 400, 'token is required', { code: 'VALIDATION_ERROR', req });
  }

  req.body.token = token;
  return next();
}

export function requireDevice(req: Request, res: Response, next: NextFunction) {
  const deviceId = String(req.body?.deviceId || req.headers['x-device-id'] || '').trim();
  if (!deviceId) {
    return sendError(res, 400, 'deviceId is required', { code: 'VALIDATION_ERROR', req });
  }

  req.body.deviceId = deviceId;
  return next();
}

export function requireRole(req: Request, res: Response, next: NextFunction) {
  const role = String(req.body?.role || '').trim();
  if (!role) {
    return sendError(res, 400, 'role is required', { code: 'VALIDATION_ERROR', req });
  }

  req.body.role = role;
  return next();
}
