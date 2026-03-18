'use client';

import { useState } from 'react';
import { Phone } from 'lucide-react';
import { buttonStyles } from '@/lib/ui-constants';
import { capturePublicCtaLead, getLeadCapturePrefill, type LeadActionType } from '@/lib/public-lead-capture';
import {
  DEFAULT_ACTION_BUTTONS,
  normalizeActionButtons,
  resolveActionHref,
  type ActionButtonsConfig,
} from '@/lib/action-buttons';
import LeadCaptureModal from './lead-capture-modal';

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
  const [pendingAction, setPendingAction] = useState<{
    actionType: LeadActionType;
    source: string;
    redirectUrl: string;
    buttonId: string;
  } | null>(null);

  const phoneNumber = phone || '';
  const buttons = actionButtons ? normalizeActionButtons(actionButtons) : DEFAULT_ACTION_BUTTONS;
  const prefill = getLeadCapturePrefill(tenantSlug);

  const whatsappHref = resolveActionHref(
    buttons.chatWhatsApp,
    `https://wa.me/${phoneNumber}?text=Hi, I'm interested in your services`,
    { whatsappMessage: "Hi, I'm interested in your services" },
  );
  const callHref = resolveActionHref(buttons.call, `tel:${phoneNumber}`);

  const openCapture = (action: {
    actionType: LeadActionType;
    source: string;
    redirectUrl: string;
    buttonId: string;
  }) => {
    setPendingAction(action);
  };

  return (
    <div style={{ padding: '16px 16px 0 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {buttons.chatWhatsApp.enabled && (
          <a
            onClick={(event) => {
              event.preventDefault();
              openCapture({
                actionType: 'whatsapp_click',
                source: 'WhatsApp',
                redirectUrl: whatsappHref,
                buttonId: 'quick-chat-whatsapp',
              });
            }}
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
            onClick={(event) => {
              event.preventDefault();
              openCapture({
                actionType: 'call_click',
                source: 'Call',
                redirectUrl: callHref,
                buttonId: 'quick-call',
              });
            }}
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

      <LeadCaptureModal
        open={Boolean(pendingAction)}
        title="Share details to continue"
        submitLabel="Continue"
        defaultName={prefill?.name}
        defaultPhone={prefill?.phone}
        onClose={() => setPendingAction(null)}
        onSubmit={async ({ name, phone: submittedPhone, location }) => {
          if (!pendingAction) return;

          const response = await capturePublicCtaLead({
            tenantSlug,
            source: pendingAction.source,
            actionType: pendingAction.actionType,
            name,
            phone: submittedPhone,
            location,
            pageUrl: window.location.href,
            buttonId: pendingAction.buttonId,
          });

          if (!response.success) {
            throw new Error('Could not capture lead details');
          }

          const target = pendingAction.redirectUrl;
          setPendingAction(null);
          if (pendingAction.actionType === 'call_click') {
            window.location.href = target;
            return;
          }

          window.open(target, '_blank', 'noopener,noreferrer');
        }}
      />
    </div>
  );
}
