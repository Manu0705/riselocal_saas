import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../infrastructure/jwt.service';
import { AppError } from '../../../shared/errors/app-error';

const jwtService = new JwtService();

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Unauthorized', 401);
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    throw new AppError('Invalid token format', 401);
  }

  try {
    const payload = jwtService.verify(token);

    req.user = {
      id: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role as any,
    };

    next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}
