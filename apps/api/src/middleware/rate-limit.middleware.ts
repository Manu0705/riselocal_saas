import { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 60_000;
const DEFAULT_MAX = 120;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function keyFromRequest(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `${ip}:${req.path}`;
}

export function rateLimitMiddleware(limit = DEFAULT_MAX) {
  return function handleRateLimit(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const key = keyFromRequest(req);

    const current = buckets.get(key);

    if (!current || current.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return next();
    }

    current.count += 1;

    if (current.count > limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again shortly.',
      });
    }

    return next();
  };
}
