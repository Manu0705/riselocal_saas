import { NextFunction, Request, Response } from 'express';
import { isAdminRole } from '@saas/domain-core/auth.contract';
import { sendError } from '../../../shared/http/api-response';

export function adminRoleMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isAdminRole(req.user?.role)) {
    return sendError(res, 403, 'Admin access required', { code: 'FORBIDDEN', req });
  }

  return next();
}
