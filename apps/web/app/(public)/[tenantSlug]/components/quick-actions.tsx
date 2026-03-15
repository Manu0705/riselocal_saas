'use client';

import { Phone } from 'lucide-react';
import { buttonStyles } from '@/lib/ui-constants';
import { capturePublicCtaLead } from '@/lib/public-lead-capture';
import {
  DEFAULT_ACTION_BUTTONS,
  normalizeActionButtons,
  resolveActionHref,
  type ActionButtonsConfig,
} from '@/lib/action-buttons';

type Props = {
  readonly phone?: string;
  readonly tenantId?: string;
  readonly tenantSlug?: string;
  readonly actionButtons?: ActionButtonsConfig;
};

export default function QuickActions({
  phone,
  tenantId,
  tenantSlug,
  actionButtons,
}: Readonly<Props>) {
  const phoneNumber = phone || '';
  const buttons = actionButtons ? normalizeActionButtons(actionButtons) : DEFAULT_ACTION_BUTTONS;

  const whatsappHref = resolveActionHref(
    buttons.chatWhatsApp,
    `https://wa.me/${phoneNumber}?text=Hi, I'm interested in your services`,
    { whatsappMessage: "Hi, I'm interested in your services" },
  );
  const callHref = resolveActionHref(buttons.call, `tel:${phoneNumber}`);

  const captureLead = (source: string) => {
    void capturePublicCtaLead({
      tenantId,
      tenantSlug,
      source,
      phone,
    });
  };

  return (
    <div style={{ padding: '16px 16px 0 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {buttons.chatWhatsApp.enabled && (
          <a
            onClick={() => captureLead('Chat on WhatsApp')}
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...buttonStyles.whatsapp,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 0,
            }}
          >
            <span>{buttons.chatWhatsApp.label || 'Chat on WhatsApp'}</span>
            <span>&gt;</span>
          </a>
        )}

        {buttons.call.enabled && (
          <a
            onClick={() => captureLead('Call Button')}
            href={callHref}
            style={{
              ...buttonStyles.call,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 0,
            }}
          >
            <Phone size={18} />
            {buttons.call.label || 'Call'}
          </a>
        )}
      </div>
    </div>
  );
}
