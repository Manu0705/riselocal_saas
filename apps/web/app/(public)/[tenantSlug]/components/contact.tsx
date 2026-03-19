'use client';

import { useState } from 'react';
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
  const [pendingAction, setPendingAction] = useState<{
    actionType: LeadActionType;
    source: string;
    redirectUrl: string;
    buttonId: string;
  } | null>(null);

  const phone = tenant?.phone || '';
  const buttons = actionButtons ? normalizeActionButtons(actionButtons) : DEFAULT_ACTION_BUTTONS;
  const prefill = getLeadCapturePrefill(tenantSlug);
  const callHref = resolveActionHref(buttons.call, `tel:${phone}`);
  const whatsappHref = resolveActionHref(buttons.chatWhatsApp, `https://wa.me/${phone}`);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Contact</h2>

      <div style={{ display: 'grid', gap: 10 }}>
        {buttons.call.enabled && (
          <a
            onClick={(event) => {
              event.preventDefault();
              setPendingAction({
                actionType: 'call_click',
                source: 'Call',
                redirectUrl: callHref,
                buttonId: 'contact-call',
              });
            }}
            href={callHref}
            style={{
              ...buttonStyles.call,
              marginTop: 0,
            }}
          >
            Call Now
          </a>
        )}

        {buttons.chatWhatsApp.enabled && (
          <a
            onClick={(event) => {
              event.preventDefault();
              setPendingAction({
                actionType: 'whatsapp_click',
                source: 'WhatsApp',
                redirectUrl: whatsappHref,
                buttonId: 'contact-whatsapp',
              });
            }}
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...buttonStyles.whatsapp,
              marginTop: 0,
            }}
          >
            WhatsApp
          </a>
        )}
      </div>

      <LeadCaptureModal
        open={Boolean(pendingAction)}
        title="Before you continue"
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
            pageUrl: globalThis.location.href,
            buttonId: pendingAction.buttonId,
          });

          if (!response.success) {
            throw new Error(response.message || 'Could not capture lead details');
          }

          const target = pendingAction.redirectUrl;
          const mode = pendingAction.actionType;
          setPendingAction(null);

          if (mode === 'call_click') {
            globalThis.location.href = target;
            return;
          }

          globalThis.open(target, '_blank', 'noopener,noreferrer');
        }}
      />
    </div>
  );
}
