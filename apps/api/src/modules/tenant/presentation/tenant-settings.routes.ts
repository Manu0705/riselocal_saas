import { Router } from 'express';
import { authMiddleware } from '../../auth/presentation/auth.middleware';
import { prisma } from '@saas/database';

const router = Router();

type ActionButtonKey = 'chatWhatsApp' | 'call' | 'whatsappEnquiry' | 'confirmBooking';

type ActionButtonConfig = {
  enabled: boolean;
  label?: string;
  phone?: string;
  url?: string;
};

type ActionButtonsConfig = Record<ActionButtonKey, ActionButtonConfig>;

const DEFAULT_SECTION_ORDER = ['hero', 'services', 'gallery'];

const DEFAULT_ACTION_BUTTONS: ActionButtonsConfig = {
  chatWhatsApp: { enabled: true, label: 'Chat on WhatsApp' },
  call: { enabled: true, label: 'Call' },
  whatsappEnquiry: { enabled: true, label: 'WhatsApp Enquiry' },
  confirmBooking: { enabled: true, label: 'Confirm Booking' },
};

function getDefaultActionButtons(): ActionButtonsConfig {
  return {
    chatWhatsApp: { ...DEFAULT_ACTION_BUTTONS.chatWhatsApp },
    call: { ...DEFAULT_ACTION_BUTTONS.call },
    whatsappEnquiry: { ...DEFAULT_ACTION_BUTTONS.whatsappEnquiry },
    confirmBooking: { ...DEFAULT_ACTION_BUTTONS.confirmBooking },
  };
}

function normalizeActionButtonConfig(value: unknown, fallback: ActionButtonConfig): ActionButtonConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    enabled: raw.enabled === undefined ? fallback.enabled : Boolean(raw.enabled),
    label: typeof raw.label === 'string' && raw.label.trim().length > 0 ? raw.label.trim() : fallback.label,
    phone: typeof raw.phone === 'string' && raw.phone.trim().length > 0 ? raw.phone.trim() : undefined,
    url: typeof raw.url === 'string' && raw.url.trim().length > 0 ? raw.url.trim() : undefined,
  };
}

function normalizeActionButtons(value: unknown): ActionButtonsConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    chatWhatsApp: normalizeActionButtonConfig(raw.chatWhatsApp, DEFAULT_ACTION_BUTTONS.chatWhatsApp),
    call: normalizeActionButtonConfig(raw.call, DEFAULT_ACTION_BUTTONS.call),
    whatsappEnquiry: normalizeActionButtonConfig(
      raw.whatsappEnquiry,
      DEFAULT_ACTION_BUTTONS.whatsappEnquiry,
    ),
    confirmBooking: normalizeActionButtonConfig(
      raw.confirmBooking,
      DEFAULT_ACTION_BUTTONS.confirmBooking,
    ),
  };
}

function extractSectionOrderConfig(rawValue: unknown): {
  sectionOrder: string[];
  actionButtons: ActionButtonsConfig;
} {
  if (Array.isArray(rawValue)) {
    return {
      sectionOrder: rawValue.filter((entry): entry is string => typeof entry === 'string'),
      actionButtons: getDefaultActionButtons(),
    };
  }

  if (rawValue && typeof rawValue === 'object') {
    const raw = rawValue as Record<string, unknown>;
    const sections = Array.isArray(raw.sections)
      ? raw.sections.filter((entry): entry is string => typeof entry === 'string')
      : DEFAULT_SECTION_ORDER;

    return {
      sectionOrder: sections,
      actionButtons: normalizeActionButtons(raw.actionButtons),
    };
  }

  return {
    sectionOrder: DEFAULT_SECTION_ORDER,
    actionButtons: getDefaultActionButtons(),
  };
}

function buildSectionOrderPayload(sectionOrder: string[], actionButtons: ActionButtonsConfig) {
  return {
    sections: sectionOrder,
    actionButtons,
  };
}

function toSettingsResponse(settings: any) {
  const parsed = extractSectionOrderConfig(settings?.sectionOrder);

  return {
    ...settings,
    sectionOrder: parsed.sectionOrder,
    actionButtons: parsed.actionButtons,
  };
}

// GET tenant settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId,
          logoShape: 'circle',
          primaryColor: '#000000',
          secondaryColor: '#FFFFFF',
          sectionOrder: buildSectionOrderPayload(DEFAULT_SECTION_ORDER, DEFAULT_ACTION_BUTTONS),
        },
      });
    }

    return res.json({ success: true, data: toSettingsResponse(settings) });
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// PUT update tenant settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      logoShape,
      primaryColor,
      secondaryColor,
      sectionOrder,
      actionButtons,
      businessPhone,
      businessWhatsApp,
      tagline,
      logoUrl,
      bannerUrl,
    } = req.body;

    // Get or create settings
    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    const existingConfig = extractSectionOrderConfig(settings?.sectionOrder);
    const nextSectionOrder =
      sectionOrder !== undefined && Array.isArray(sectionOrder)
        ? sectionOrder.filter((entry: unknown): entry is string => typeof entry === 'string')
        : existingConfig.sectionOrder;
    const nextActionButtons =
      actionButtons !== undefined
        ? normalizeActionButtons(actionButtons)
        : existingConfig.actionButtons;

    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId,
          logoShape: logoShape || 'circle',
          primaryColor: primaryColor || '#000000',
          secondaryColor: secondaryColor || '#FFFFFF',
          sectionOrder: buildSectionOrderPayload(nextSectionOrder, nextActionButtons),
        },
      });
    } else {
      settings = await prisma.tenantSettings.update({
        where: { tenantId },
        data: {
          ...(logoShape !== undefined && { logoShape }),
          ...(primaryColor !== undefined && { primaryColor }),
          ...(secondaryColor !== undefined && { secondaryColor }),
          ...((sectionOrder !== undefined || actionButtons !== undefined) && {
            sectionOrder: buildSectionOrderPayload(nextSectionOrder, nextActionButtons),
          }),
          ...(businessPhone !== undefined && { businessPhone }),
          ...(businessWhatsApp !== undefined && { businessWhatsApp }),
          ...(tagline !== undefined && { tagline }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(bannerUrl !== undefined && { bannerUrl }),
        },
      });
    }

    return res.json({ success: true, data: toSettingsResponse(settings) });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
