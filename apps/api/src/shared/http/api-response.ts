import type { Response } from 'express';
import { apiError, apiSuccess, type ApiErrorResponse } from '@saas/domain-core/api-response.contract';

type RequestLike = {
  requestId?: string;
};

/**
 * Send a canonical success envelope: { success: true, data, requestId? }
 */
export function sendSuccess<T>(res: Response, status: number, data: T, req?: RequestLike) {
  return res.status(status).json(apiSuccess(data, req?.requestId));
}

/**
 * Send a canonical error envelope: { success: false, message, code?, requestId? }
 * Never use { error } — admin/web clients expect `message`.
 */
export function sendError(
  res: Response,
  status: number,
  message: string,
  options?: { code?: string; req?: RequestLike },
) {
  const body: ApiErrorResponse = apiError(message, {
    code: options?.code,
    requestId: options?.req?.requestId,
  });
  return res.status(status).json(body);
}
