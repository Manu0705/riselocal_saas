const TRANSIENT_DATABASE_CODES = new Set([
  'P1001',
  'P1002',
  'P1017',
  'P2024',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EHOSTUNREACH',
]);

export function getTransientDatabaseErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  const code = error.code;
  return typeof code === 'string' && TRANSIENT_DATABASE_CODES.has(code) ? code : null;
}

export function isTransientDatabaseError(error: unknown): boolean {
  if (getTransientDatabaseErrorCode(error)) return true;
  if (!(error instanceof Error)) return false;

  return /can't reach database server|timed out fetching a new connection from the connection pool/i.test(
    error.message,
  );
}

export async function withDatabaseReadRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  retries = 2,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (!isTransientDatabaseError(error) || attempt >= retries) throw error;

      const code = getTransientDatabaseErrorCode(error) ?? 'CONNECTION_UNAVAILABLE';
      console.warn(
        JSON.stringify({
          level: 'warn',
          action: 'database_read_retry',
          operation: operationName,
          attempt: attempt + 1,
          code,
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
    }
  }
}
