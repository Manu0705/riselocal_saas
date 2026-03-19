export type ActionButtonKey = 'chatWhatsApp' | 'call' | 'whatsappEnquiry';

export type ActionButtonConfig = {
  enabled: boolean;
  phone?: string;
  message?: string;
};

export type ActionButtonsConfig = Record<ActionButtonKey, ActionButtonConfig>;

export const DEFAULT_ACTION_BUTTONS: ActionButtonsConfig = {
  chatWhatsApp: { enabled: true },
  call: { enabled: true },
  whatsappEnquiry: { enabled: true },
};

function normalizeButtonConfig(
  value: unknown,
  fallback: ActionButtonConfig,
): ActionButtonConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    enabled: raw.enabled === undefined ? fallback.enabled : Boolean(raw.enabled),
    phone: typeof raw.phone === 'string' && raw.phone.trim().length > 0 ? raw.phone.trim() : undefined,
    message: typeof raw.message === 'string' && raw.message.trim().length > 0 ? raw.message.trim() : undefined,
  };
}

export function normalizeActionButtons(value: unknown): ActionButtonsConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    chatWhatsApp: normalizeButtonConfig(raw.chatWhatsApp, DEFAULT_ACTION_BUTTONS.chatWhatsApp),
    call: normalizeButtonConfig(raw.call, DEFAULT_ACTION_BUTTONS.call),
    whatsappEnquiry: normalizeButtonConfig(
      raw.whatsappEnquiry,
      DEFAULT_ACTION_BUTTONS.whatsappEnquiry,
    ),
  };
}

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
    const encodedMessage = message
      ? `?text=${encodeURIComponent(message)}`
      : '';
    return `https://wa.me/${phoneDigits}${encodedMessage}`;
  }

  if (fallbackHref.startsWith('tel:')) {
    return `tel:${phoneDigits}`;
  }

  return fallbackHref;
}
