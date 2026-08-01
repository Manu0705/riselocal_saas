/**
 * Canonical API response / error envelope.
 */

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  requestId?: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  code?: string;
  requestId?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function apiSuccess<T>(data: T, requestId?: string): ApiSuccessResponse<T> {
  return requestId ? { success: true, data, requestId } : { success: true, data };
}

export function apiError(
  message: string,
  options?: { code?: string; requestId?: string },
): ApiErrorResponse {
  return {
    success: false,
    message,
    ...(options?.code ? { code: options.code } : {}),
    ...(options?.requestId ? { requestId: options.requestId } : {}),
  };
}
