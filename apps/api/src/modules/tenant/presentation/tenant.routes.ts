import { Router } from 'express';
import { PrismaTenantRepository } from '../infrastructure/tenant.prisma.repository';
import { Tenant } from '../domain/tenant.entity';
import { authMiddleware } from '../../auth/presentation/auth.middleware';
import { adminRoleMiddleware } from '../../auth/presentation/admin-role.middleware';
import { optimizeCloudinaryUrl } from '../../../lib/cloudinary-transform';
import { prisma } from '@saas/database';

const router = Router();
const repository = new PrismaTenantRepository();

// Simple in-memory cache for tenant responses (180s TTL)
const tenantCache = new Map<string, { data: any; expiresAt: number }>();

function getCachedTenant(slug: string) {
  const cached = tenantCache.get(slug);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  tenantCache.delete(slug);
  return null;
}

function setCachedTenant(slug: string, data: any, ttlMs = 180000) {
  tenantCache.set(slug, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

type ActionButtonConfig = {
  enabled: boolean;
  label?: string;
  phone?: string;
  url?: string;
};

type ActionButtonsConfig = {
  chatWhatsApp: ActionButtonConfig;
  call: ActionButtonConfig;
  whatsappEnquiry: ActionButtonConfig;
  confirmBooking: ActionButtonConfig;
};

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

function extractSectionOrderConfig(rawValue: unknown): {
  sectionOrder: string[];
  actionButtons: ActionButtonsConfig;
  galleryCategories: string[];
  fontFamily: string;
} {
  if (Array.isArray(rawValue)) {
    return {
      sectionOrder: rawValue.filter((entry): entry is string => typeof entry === 'string'),
      actionButtons: getDefaultActionButtons(),
      galleryCategories: ['gallery', 'before-after', 'team', 'workspace'],
      fontFamily: 'Inter',
    };
  }

  if (rawValue && typeof rawValue === 'object') {
    const raw = rawValue as Record<string, unknown>;
    const sections = Array.isArray(raw.sections)
      ? raw.sections.filter((entry): entry is string => typeof entry === 'string')
      : ['hero', 'services', 'gallery'];
    const galleryCategories = Array.isArray(raw.galleryCategories)
      ? raw.galleryCategories.filter((entry): entry is string => typeof entry === 'string')
      : ['gallery', 'before-after', 'team', 'workspace'];
    const buttonRaw = raw.actionButtons && typeof raw.actionButtons === 'object'
      ? (raw.actionButtons as Record<string, unknown>)
      : {};

    return {
      sectionOrder: sections,
      galleryCategories,
      fontFamily:
        typeof raw.fontFamily === 'string' && raw.fontFamily.trim().length > 0
          ? raw.fontFamily.trim()
          : 'Inter',
      actionButtons: {
        chatWhatsApp: normalizeActionButtonConfig(
          buttonRaw.chatWhatsApp,
          DEFAULT_ACTION_BUTTONS.chatWhatsApp,
        ),
        call: normalizeActionButtonConfig(buttonRaw.call, DEFAULT_ACTION_BUTTONS.call),
        whatsappEnquiry: normalizeActionButtonConfig(
          buttonRaw.whatsappEnquiry,
          DEFAULT_ACTION_BUTTONS.whatsappEnquiry,
        ),
        confirmBooking: normalizeActionButtonConfig(
          buttonRaw.confirmBooking,
          DEFAULT_ACTION_BUTTONS.confirmBooking,
        ),
      },
    };
  }

  return {
    sectionOrder: ['hero', 'services', 'gallery'],
    actionButtons: getDefaultActionButtons(),
    galleryCategories: ['gallery', 'before-after', 'team', 'workspace'],
    fontFamily: 'Inter',
  };
}

function getTenantErrorResponse(error: any) {
  const message = String(error?.message || '');
  const code = String(error?.code || '');
  const target = Array.isArray(error?.meta?.target) ? error.meta.target : [];

  if (code === 'P2021' || message.includes('does not exist in the current database')) {
    return {
      status: 500,
      message: 'Database schema is not initialized. Run Prisma migrations.',
    };
  }

  if (code === 'P2002') {
    if (target.includes('slug')) {
      return {
        status: 400,
        message: 'Tenant slug already exists.',
      };
    }

    if (target.includes('domain')) {
      return {
        status: 400,
        message: 'Custom domain already exists.',
      };
    }

    return {
      status: 400,
      message: 'A tenant with the same unique values already exists.',
    };
  }

  return {
    status: 400,
    message: message || 'Failed to save tenant.',
  };
}

const RESERVED_SLUGS = [
  'dashboard',
  'admin',
  'analytics',
  'leads',
  'followups',
  'feedback',
  'tenants',
  'settings',
  'login',
  'api',
  '_next',
  'qa',
  'www',
];

function toSlug(value: string): string {
  const unsupportedCharsRegex = /[^a-z0-9\s-]/g;
  const spacesRegex = /\s+/g;
  const duplicateDashRegex = /-+/g;
  const edgeDashRegex = /^-|-$/g;

  return value
    .trim()
    .toLowerCase()
    .replace(unsupportedCharsRegex, '')
    .replace(spacesRegex, '-')
    .replace(duplicateDashRegex, '-')
    .replace(edgeDashRegex, '');
}

/* =========================================
   CREATE TENANT
   POST /tenants
========================================= */

router.post('/tenants', authMiddleware, adminRoleMiddleware, async (req, res) => {
  try {
    const { name, domain, slug } = req.body;

    const resolvedSlug = toSlug(slug || name || '');

    if (RESERVED_SLUGS.includes(resolvedSlug)) {
      return res.status(400).json({
        success: false,
        message: `Slug "${resolvedSlug}" is reserved and cannot be used`,
      });
    }

    const tenant = Tenant.create(name, resolvedSlug, domain);

    await repository.save(tenant);

    return res.status(201).json({
      success: true,
      data: tenant.toJSON(),
    });
  } catch (error: any) {
    const response = getTenantErrorResponse(error);

    return res.status(response.status).json({
      success: false,
      message: response.message,
    });
  }
});

/* =========================================
   GET TENANT BY SLUG
   GET /tenants/slug/:slug
========================================= */

router.get('/tenants/slug/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '')
      .trim()
      .toLowerCase();

    // Check cache first
    const cached = getCachedTenant(slug);
    if (cached) {
      return res
        .set('Cache-Control', 'public, max-age=300, s-maxage=600')
        .set('X-Cache', 'HIT')
        .json({
          success: true,
          data: cached,
        });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        settings: true,
        galleryImages: {
          orderBy: [{ category: 'asc' }, { position: 'asc' }],
          take: 20,
        },
        services: {
          orderBy: { position: 'asc' },
        },
        socialLinks: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const sectionConfig = extractSectionOrderConfig(tenant.settings?.sectionOrder);

    const publicTenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      createdAt: tenant.createdAt,
      settings: tenant.settings
        ? {
            logoUrl: optimizeCloudinaryUrl(tenant.settings.logoUrl),
            bannerUrl: optimizeCloudinaryUrl(tenant.settings.bannerUrl),
            logoShape: tenant.settings.logoShape,
            primaryColor: tenant.settings.primaryColor,
            secondaryColor: tenant.settings.secondaryColor,
            fontFamily: sectionConfig.fontFamily,
            sectionOrder: sectionConfig.sectionOrder,
            galleryCategories: sectionConfig.galleryCategories,
            actionButtons: sectionConfig.actionButtons,
            businessPhone: tenant.settings.businessPhone,
            businessWhatsApp: tenant.settings.businessWhatsApp,
            tagline: tenant.settings.tagline,
          }
        : null,
      galleryImages: tenant.galleryImages.map((image) => ({
        url: optimizeCloudinaryUrl(image.url),
        category: image.category,
        position: image.position,
        alt: image.alt,
      })),
      services: tenant.services.map((service) => ({
        name: service.name,
        description: service.description,
        icon: service.icon,
        position: service.position,
      })),
      socialLinks: tenant.socialLinks.map((link) => ({
        platform: link.platform,
        url: link.url,
        label: link.label,
      })),
    };

    // Cache the response
    setCachedTenant(slug, publicTenant);

    return res
      .set('Cache-Control', 'public, max-age=300, s-maxage=600')
      .set('X-Cache', 'MISS')
      .json({
        success: true,
        data: publicTenant,
      });
  } catch (error: any) {
    const response = getTenantErrorResponse(error);

    return res.status(response.status).json({
      success: false,
      message: response.message,
    });
  }
});

router.use('/tenants', authMiddleware, adminRoleMiddleware);

/* =========================================
   LIST ACTIVE TENANTS
   GET /tenants
========================================= */

router.get('/tenants', async (_req, res) => {
  try {
    const tenants = await repository.findAllActive();

    return res.json({
      success: true,
      data: tenants.map((t) => t.toJSON()),
    });
  } catch (error: any) {
    const response = getTenantErrorResponse(error);

    return res.status(response.status).json({
      success: false,
      message: response.message,
    });
  }
});

/* =========================================
   UPDATE TENANT
   PUT /tenants/:id
========================================= */

router.put('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, domain } = req.body;

    const tenant = await repository.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const resolvedSlug = toSlug(slug || name || '');
    tenant.update(name, resolvedSlug, domain);

    await repository.update(tenant);

    return res.json({
      success: true,
      data: tenant.toJSON(),
    });
  } catch (error: any) {
    const response = getTenantErrorResponse(error);

    return res.status(response.status).json({
      success: false,
      message: response.message,
    });
  }
});

/* =========================================
   DELETE TENANT
   DELETE /tenants/:id
========================================= */

router.delete('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await repository.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    await repository.delete(id);

    return res.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (error: any) {
    const response = getTenantErrorResponse(error);

    return res.status(response.status).json({
      success: false,
      message: response.message,
    });
  }
});

export default router;
