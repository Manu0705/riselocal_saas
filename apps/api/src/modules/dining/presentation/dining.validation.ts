import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../../../shared/http/api-response';

export function requireTenantAndLocation(req: Request, res: Response, next: NextFunction) {
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

export function requireMenuId(req: Request, res: Response, next: NextFunction) {
  const menuId = String(req.body?.menuId || req.query.menuId || '').trim();

  if (!menuId) {
    return sendError(res, 400, 'menuId is required', { code: 'VALIDATION_ERROR', req });
  }

  req.body.menuId = menuId;
  return next();
}

export function requireCategoryId(req: Request, res: Response, next: NextFunction) {
  const categoryId = String(req.body?.categoryId || req.query.categoryId || req.params.id || '').trim();

  if (!categoryId) {
    return sendError(res, 400, 'categoryId is required', { code: 'VALIDATION_ERROR', req });
  }

  req.body.categoryId = categoryId;
  return next();
}

export function requireItemId(req: Request, res: Response, next: NextFunction) {
  const itemId = String(req.params.id || req.body?.itemId || req.query.itemId || '').trim();

  if (!itemId) {
    return sendError(res, 400, 'itemId is required', { code: 'VALIDATION_ERROR', req });
  }

  req.body.itemId = itemId;
  return next();
}

export function requireVariantId(req: Request, res: Response, next: NextFunction) {
  const variantId = String(req.params.id || req.body?.variantId || '').trim();

  if (!variantId) {
    return sendError(res, 400, 'variantId is required', { code: 'VALIDATION_ERROR', req });
  }

  req.body.variantId = variantId;
  return next();
}

export function requireVariantItemId(req: Request, res: Response, next: NextFunction) {
  const itemId = String(req.body?.itemId || req.query.itemId || '').trim();

  if (!itemId) {
    return sendError(res, 400, 'itemId is required', { code: 'VALIDATION_ERROR', req });
  }

  req.body.itemId = itemId;
  return next();
}
