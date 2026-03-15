'use client';

import { buttonStyles } from '@/lib/ui-constants';
import { capturePublicCtaLead } from '@/lib/public-lead-capture';
import {
  DEFAULT_ACTION_BUTTONS,
  normalizeActionButtons,
  resolveActionHref,
  type ActionButtonsConfig,
} from '@/lib/action-buttons';

type Props = {
  readonly tenant?: {
    readonly phone?: string;
    readonly name?: string;
  };
  readonly tenantId?: string;
  readonly tenantSlug?: string;
  readonly actionButtons?: ActionButtonsConfig;
};

export default function Contact({
  tenant,
  tenantId,
  tenantSlug,
  actionButtons,
}: Readonly<Props>) {
  const phone = tenant?.phone || '';
  const buttons = actionButtons ? normalizeActionButtons(actionButtons) : DEFAULT_ACTION_BUTTONS;
  const callHref = resolveActionHref(buttons.call, `tel:${phone}`);
  const whatsappHref = resolveActionHref(buttons.chatWhatsApp, `https://wa.me/${phone}`);

  const captureLead = (source: string) => {
    void capturePublicCtaLead({
      tenantId,
      tenantSlug,
      source,
      phone,
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Contact</h2>

      <div style={{ display: 'grid', gap: 10 }}>
        {buttons.call.enabled && (
          <a
            onClick={() => captureLead('Contact Call')}
            href={callHref}
            style={{
              ...buttonStyles.call,
              marginTop: 0,
            }}
          >
            {buttons.call.label || 'Call Now'}
          </a>
        )}

        {buttons.chatWhatsApp.enabled && (
          <a
            onClick={() => captureLead('Contact WhatsApp')}
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...buttonStyles.whatsapp,
              marginTop: 0,
            }}
          >
            {buttons.chatWhatsApp.label || 'WhatsApp'}
          </a>
        )}
      </div>
    </div>
  );
}
