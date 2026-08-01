export function getAnalyticsErrorMessage(reason: unknown): string {
  if (reason instanceof Error && reason.message && reason.message.trim()) {
    return reason.message;
  }

  if (typeof reason === 'string' && reason.trim()) {
    return reason.trim();
  }

  return 'We could not load analytics right now. Please try again.';
}
