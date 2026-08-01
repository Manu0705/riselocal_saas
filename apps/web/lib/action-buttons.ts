/**
 * Web-only href helpers. Action button types/normalization live in
 * @saas/domain-core/tenant.contract — do not reintroduce local copies.
 */

import type { ActionButtonConfig } from '@saas/domain-core/tenant.contract';

export type ActionButtonKey = 'chatWhatsApp' | 'call' | 'whatsappEnquiry';

export function resolveActionHref(
  button: ActionButtonConfig,
  fallbackHref: string,
  options?: { whatsappMessage?: string },
): string {
  const phoneDigits = String(button.phone ?? '').replaceAll(/\D/g, '');
  if (!phoneDigits) {
    return fallbackHref;
  }

  if (fallbackHref.startsWith('https://wa.me/')) {
    const message = button.message ?? options?.whatsappMessage;
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${phoneDigits}${encodedMessage}`;
  }

  if (fallbackHref.startsWith('tel:')) {
    return `tel:${phoneDigits}`;
  }

  return fallbackHref;
}
