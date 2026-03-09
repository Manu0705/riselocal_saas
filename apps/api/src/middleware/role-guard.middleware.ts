import { Request, Response, NextFunction } from "express";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
};

export function roleGuard(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized: User not authenticated",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: Insufficient permissions",
      });
    }

    next();
  };
}