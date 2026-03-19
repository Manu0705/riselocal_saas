import { Router } from 'express';
import { authMiddleware } from '../../auth/presentation/auth.middleware';
import { prisma } from '@saas/database';

const router = Router();

type ActionButtonKey = 'chatWhatsApp' | 'call' | 'whatsappEnquiry';

type ActionButtonConfig = {
  enabled: boolean;
  phone?: string;
  message?: string;
};

type ActionButtonsConfig = Record<ActionButtonKey, ActionButtonConfig>;

const DEFAULT_SECTION_ORDER = ['hero', 'services', 'gallery'];

const DEFAULT_ACTION_BUTTONS: ActionButtonsConfig = {
  chatWhatsApp: { enabled: true },
  call: { enabled: true },
  whatsappEnquiry: { enabled: true },
};

const DEFAULT_GALLERY_CATEGORIES = ['gallery', 'before-after', 'team', 'workspace'];

function getDefaultActionButtons(): ActionButtonsConfig {
  return {
    chatWhatsApp: { ...DEFAULT_ACTION_BUTTONS.chatWhatsApp },
    call: { ...DEFAULT_ACTION_BUTTONS.call },
    whatsappEnquiry: { ...DEFAULT_ACTION_BUTTONS.whatsappEnquiry },
  };
}

function normalizeActionButtonConfig(value: unknown, fallback: ActionButtonConfig): ActionButtonConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    enabled: raw.enabled === undefined ? fallback.enabled : Boolean(raw.enabled),
    phone: typeof raw.phone === 'string' && raw.phone.trim().length > 0 ? raw.phone.trim() : undefined,
    message: typeof raw.message === 'string' && raw.message.trim().length > 0 ? raw.message.trim() : undefined,
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
  };
}

function extractSectionOrderConfig(rawValue: unknown): {
  sectionOrder: string[];
  actionButtons: ActionButtonsConfig;
  galleryCategories: string[];
} {
  if (Array.isArray(rawValue)) {
    return {
      sectionOrder: rawValue.filter((entry): entry is string => typeof entry === 'string'),
      actionButtons: getDefaultActionButtons(),
      galleryCategories: DEFAULT_GALLERY_CATEGORIES,
    };
  }

  if (rawValue && typeof rawValue === 'object') {
    const raw = rawValue as Record<string, unknown>;
    const sections = Array.isArray(raw.sections)
      ? raw.sections.filter((entry): entry is string => typeof entry === 'string')
      : DEFAULT_SECTION_ORDER;

    const galleryCategories = Array.isArray(raw.galleryCategories)
      ? raw.galleryCategories.filter((entry): entry is string => typeof entry === 'string')
      : DEFAULT_GALLERY_CATEGORIES;

    return {
      sectionOrder: sections,
      actionButtons: normalizeActionButtons(raw.actionButtons),
      galleryCategories,
    };
  }

  return {
    sectionOrder: DEFAULT_SECTION_ORDER,
    actionButtons: getDefaultActionButtons(),
    galleryCategories: DEFAULT_GALLERY_CATEGORIES,
  };
}

function buildSectionOrderPayload(
  sectionOrder: string[],
  actionButtons: ActionButtonsConfig,
  galleryCategories: string[] = DEFAULT_GALLERY_CATEGORIES,
) {
  return {
    sections: sectionOrder,
    actionButtons,
    galleryCategories,
  };
}

function toSettingsResponse(settings: any) {
  const parsed = extractSectionOrderConfig(settings?.sectionOrder);

  return {
    ...settings,
    sectionOrder: parsed.sectionOrder,
    actionButtons: parsed.actionButtons,
    galleryCategories: parsed.galleryCategories,
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
      galleryCategories,
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
    const nextGalleryCategories =
      galleryCategories !== undefined && Array.isArray(galleryCategories)
        ? galleryCategories.filter((entry: unknown): entry is string => typeof entry === 'string')
        : existingConfig.galleryCategories;

    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId,
          logoShape: logoShape || 'circle',
          primaryColor: primaryColor || '#000000',
          secondaryColor: secondaryColor || '#FFFFFF',
          sectionOrder: buildSectionOrderPayload(nextSectionOrder, nextActionButtons, nextGalleryCategories),
        },
      });
    } else {
      settings = await prisma.tenantSettings.update({
        where: { tenantId },
        data: {
          ...(logoShape !== undefined && { logoShape }),
          ...(primaryColor !== undefined && { primaryColor }),
          ...(secondaryColor !== undefined && { secondaryColor }),
          ...((sectionOrder !== undefined || actionButtons !== undefined || galleryCategories !== undefined) && {
            sectionOrder: buildSectionOrderPayload(nextSectionOrder, nextActionButtons, nextGalleryCategories),
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
