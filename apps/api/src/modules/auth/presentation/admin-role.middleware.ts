import { NextFunction, Request, Response } from 'express';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export function adminRoleMiddleware(req: Request, res: Response, next: NextFunction) {
  const role = String(req.user?.role || '').toLowerCase();

  if (!ADMIN_ROLES.has(role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  return next();
}
