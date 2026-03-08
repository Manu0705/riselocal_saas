import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/app-error";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const request = req as Request & {
    requestId?: string;
    tenantSlug?: string;
    tenant?: { slug?: string };
    user?: { tenantId?: string };
  };

  const tenant = request.tenantSlug || request.tenant?.slug || request.user?.tenantId || "n/a";

  if (err instanceof AppError) {
    console.error(
      JSON.stringify({
        level: "warn",
        requestId: request.requestId,
        tenant,
        message: err.message,
        statusCode: err.statusCode,
      })
    );

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      requestId: request.requestId,
    });
  }

  console.error(
    JSON.stringify({
      level: "error",
      requestId: request.requestId,
      tenant,
      message: err?.message || "Unhandled error",
      stack: err?.stack,
    })
  );

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    requestId: request.requestId,
  });
}