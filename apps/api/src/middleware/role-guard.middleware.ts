import { Request, Response, NextFunction } from 'express';
import { sendError } from '../shared/http/api-response';

export function roleGuard(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, 'Unauthorized: User not authenticated', {
        code: 'UNAUTHORIZED',
        req,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, 'Forbidden: Insufficient permissions', {
        code: 'FORBIDDEN',
        req,
      });
    }

    next();
  };
}
