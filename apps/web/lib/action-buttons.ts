export type ActionButtonKey = 'chatWhatsApp' | 'call' | 'whatsappEnquiry' | 'confirmBooking';

export type ActionButtonConfig = {
  enabled: boolean;
  label?: string;
  phone?: string;
  url?: string;
};

export type ActionButtonsConfig = Record<ActionButtonKey, ActionButtonConfig>;

export const DEFAULT_ACTION_BUTTONS: ActionButtonsConfig = {
  chatWhatsApp: { enabled: true, label: 'Chat on WhatsApp' },
  call: { enabled: true, label: 'Call' },
  whatsappEnquiry: { enabled: true, label: 'WhatsApp Enquiry' },
  confirmBooking: { enabled: true, label: 'Confirm Booking' },
};

function normalizeButtonConfig(
  value: unknown,
  fallback: ActionButtonConfig,
): ActionButtonConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    enabled: raw.enabled === undefined ? fallback.enabled : Boolean(raw.enabled),
    label:
      typeof raw.label === 'string' && raw.label.trim().length > 0 ? raw.label.trim() : fallback.label,
    phone: typeof raw.phone === 'string' && raw.phone.trim().length > 0 ? raw.phone.trim() : undefined,
    url: typeof raw.url === 'string' && raw.url.trim().length > 0 ? raw.url.trim() : undefined,
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
    confirmBooking: normalizeButtonConfig(
      raw.confirmBooking,
      DEFAULT_ACTION_BUTTONS.confirmBooking,
    ),
  };
}

export function resolveActionHref(
  button: ActionButtonConfig,
  fallbackHref: string,
  options?: { whatsappMessage?: string },
): string {
  if (button.url && button.url.trim().length > 0) {
    return button.url.trim();
  }

  const phoneDigits = String(button.phone ?? '').replaceAll(/\D/g, '');
  if (!phoneDigits) {
    return fallbackHref;
  }

  if (fallbackHref.startsWith('https://wa.me/')) {
    const encodedMessage = options?.whatsappMessage
      ? `?text=${encodeURIComponent(options.whatsappMessage)}`
      : '';
    return `https://wa.me/${phoneDigits}${encodedMessage}`;
  }

  if (fallbackHref.startsWith('tel:')) {
    return `tel:${phoneDigits}`;
  }

  return fallbackHref;
}
