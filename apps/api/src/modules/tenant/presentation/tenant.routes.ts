import { Router } from 'express';
import { PrismaTenantRepository } from '../infrastructure/tenant.prisma.repository';
import { Tenant } from '../domain/tenant.entity';
import { authMiddleware } from '../../auth/presentation/auth.middleware';
import { adminRoleMiddleware } from '../../auth/presentation/admin-role.middleware';
import {
  getDefaultActionButtons,
  normalizeActionButtons,
  normalizeAvailableHours,
  normalizeHour,
  normalizeTenantThemeKey,
  resolveThemeInput,
  type ActionButtonsConfig,
  type TenantCustomization,
  type TenantPublicPayload,
} from '@saas/domain-core/tenant.contract';
import { optimizeCloudinaryUrl } from '../../../lib/cloudinary-transform';
import { prisma } from '@saas/database';
import {
  getPublicTenantCache,
  invalidatePublicTenantCacheBySlug,
  setPublicTenantCache,
} from '../infrastructure/public-tenant-cache';
import { sendError, sendSuccess } from '../../../shared/http/api-response';

const router = Router();
const repository = new PrismaTenantRepository();


function extractSectionOrderConfig(rawValue: unknown): {
  sectionOrder: string[];
  actionButtons: ActionButtonsConfig;
  galleryCategories: string[];
  fontFamily: string;
  themeKey: string;
} {
  if (Array.isArray(rawValue)) {
    return {
      sectionOrder: rawValue.filter((entry): entry is string => typeof entry === 'string'),
      actionButtons: getDefaultActionButtons(),
      galleryCategories: ['gallery', 'before-after', 'team', 'workspace'],
      fontFamily: 'Inter',
      themeKey: 'default',
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

    return {
      sectionOrder: sections,
      galleryCategories,
      fontFamily:
        typeof raw.fontFamily === 'string' && raw.fontFamily.trim().length > 0
          ? raw.fontFamily.trim()
          : 'Inter',
      themeKey: normalizeTenantThemeKey(raw.themeKey),
      actionButtons: normalizeActionButtons(raw.actionButtons),
    };
  }

  return {
    sectionOrder: ['hero', 'services', 'gallery'],
    actionButtons: getDefaultActionButtons(),
    galleryCategories: ['gallery', 'before-after', 'team', 'workspace'],
    fontFamily: 'Inter',
    themeKey: 'default',
  };
}

function buildSectionOrderPayload(
  sectionOrder: string[],
  actionButtons: ActionButtonsConfig,
  galleryCategories: string[] = ['gallery', 'before-after', 'team', 'workspace'],
  fontFamily = 'Inter',
  themeKey: string = 'default',
) {
  return {
    sections: sectionOrder,
    actionButtons,
    galleryCategories,
    fontFamily,
    themeKey: normalizeTenantThemeKey(themeKey),
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
  'wp-admin',
  'xmlrpc',
];

const TENANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
    const { name, domain, slug, theme, themeKey } = req.body;
    const resolvedSlug = toSlug(slug || name || '');
    const normalizedTheme = resolveThemeInput({ theme, themeKey });

    if (RESERVED_SLUGS.includes(resolvedSlug)) {
      return sendError(res, 400, `Slug "${resolvedSlug}" is reserved and cannot be used`, {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    const tenant = Tenant.create(name, resolvedSlug, domain);

    await repository.save(tenant);

    const tenantId = tenant.toJSON().id;
    const existingSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });
    const existingConfig = extractSectionOrderConfig(existingSettings?.sectionOrder);

    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        logoShape: existingSettings?.logoShape || 'circle',
        primaryColor: existingSettings?.primaryColor || '#000000',
        secondaryColor: existingSettings?.secondaryColor || '#FFFFFF',
        businessPhone: existingSettings?.businessPhone,
        businessWhatsApp: existingSettings?.businessWhatsApp,
        tagline: existingSettings?.tagline,
        logoUrl: existingSettings?.logoUrl,
        bannerUrl: existingSettings?.bannerUrl,
        sectionOrder: buildSectionOrderPayload(
          existingConfig.sectionOrder,
          existingConfig.actionButtons,
          existingConfig.galleryCategories,
          existingConfig.fontFamily,
          normalizedTheme,
        ),
      },
      update: {
        sectionOrder: buildSectionOrderPayload(
          existingConfig.sectionOrder,
          existingConfig.actionButtons,
          existingConfig.galleryCategories,
          existingConfig.fontFamily,
          normalizedTheme,
        ),
      },
    });

    return sendSuccess(
      res,
      201,
      {
        ...tenant.toJSON(),
        theme: normalizedTheme,
        themeKey: normalizedTheme,
      },
      req,
    );
  } catch (error: any) {
    const response = getTenantErrorResponse(error);

    return sendError(res, response.status, response.message, { code: 'TENANT_ERROR', req });
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

    if (!TENANT_SLUG_PATTERN.test(slug) || RESERVED_SLUGS.includes(slug)) {
      return sendError(res, 404, 'Tenant not found', { code: 'NOT_FOUND', req });
    }

    // Check cache first
    const cached = getPublicTenantCache(slug) as TenantPublicPayload | null;
    if (cached) {
      res.set('Cache-Control', 'no-store').set('X-Cache', 'HIT');
      return sendSuccess(res, 200, cached, req);
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
      return sendError(res, 404, 'Tenant not found', { code: 'NOT_FOUND', req });
    }

    const sectionConfig = extractSectionOrderConfig(tenant.settings?.sectionOrder);
    const theme = normalizeTenantThemeKey(sectionConfig.themeKey);
    const openHour = normalizeHour(tenant.settings?.openHour);
    const closeHour = normalizeHour(tenant.settings?.closeHour);
    const availableHours = normalizeAvailableHours(tenant.settings?.availableHours);
    const customization: TenantCustomization = {
      logoUrl: tenant.settings?.logoUrl ? optimizeCloudinaryUrl(tenant.settings.logoUrl) : undefined,
      bannerUrl: tenant.settings?.bannerUrl ? optimizeCloudinaryUrl(tenant.settings.bannerUrl) : undefined,
      logoShape: tenant.settings?.logoShape ?? 'circle',
      primaryColor: tenant.settings?.primaryColor ?? '#000000',
      secondaryColor: tenant.settings?.secondaryColor ?? '#FFFFFF',
      fontFamily: sectionConfig.fontFamily,
      theme,
      sectionOrder: sectionConfig.sectionOrder,
      galleryCategories: sectionConfig.galleryCategories,
      actionButtons: sectionConfig.actionButtons,
      businessPhone: tenant.settings?.businessPhone ?? undefined,
      businessWhatsApp: tenant.settings?.businessWhatsApp ?? undefined,
      tagline: tenant.settings?.tagline ?? undefined,
      ...(openHour !== undefined ? { openHour } : {}),
      ...(closeHour !== undefined ? { closeHour } : {}),
      ...(availableHours !== undefined ? { availableHours } : {}),
    };

    const publicTenant: TenantPublicPayload = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      createdAt:
        tenant.createdAt instanceof Date ? tenant.createdAt.toISOString() : String(tenant.createdAt),
      updatedAt:
        tenant.updatedAt instanceof Date ? tenant.updatedAt.toISOString() : String(tenant.updatedAt),
      theme,
      customization,
      galleryImages: tenant.galleryImages.map((image) => ({
        url: optimizeCloudinaryUrl(image.url),
        category: image.category,
        position: image.position,
        alt: image.alt ?? undefined,
      })),
      services: tenant.services.map((service) => ({
        name: service.name,
        description: service.description ?? undefined,
        icon: service.icon ?? undefined,
        position: service.position,
      })),
      socialLinks: tenant.socialLinks.map((link) => ({
        platform: link.platform,
        url: link.url,
        label: link.label ?? undefined,
      })),
    };

    setPublicTenantCache(slug, publicTenant);

    res.set('Cache-Control', 'no-store').set('X-Cache', 'MISS');
    return sendSuccess(res, 200, publicTenant, req);
  } catch (error: any) {
    const response = getTenantErrorResponse(error);
    return sendError(res, response.status, response.message, { code: 'TENANT_ERROR', req });
  }
});

router.use('/tenants', authMiddleware, adminRoleMiddleware);

/* =========================================
   LIST ACTIVE TENANTS
   GET /tenants
========================================= */

router.get('/tenants', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: { settings: true },
    });

    return sendSuccess(
      res,
      200,
      tenants.map((tenant) => {
        const theme = normalizeTenantThemeKey(extractSectionOrderConfig(tenant.settings?.sectionOrder).themeKey);
        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
          theme,
          themeKey: theme,
        };
      }),
      req,
    );
  } catch (error: any) {
    const response = getTenantErrorResponse(error);

    return sendError(res, response.status, response.message, { code: 'TENANT_ERROR', req });
  }
});

/* =========================================
   UPDATE TENANT
   PUT /tenants/:id
========================================= */

router.put('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, domain, theme, themeKey } = req.body;
    const normalizedTheme = resolveThemeInput({ theme, themeKey });

    const tenant = await repository.findById(id);

    if (!tenant) {
      return sendError(res, 404, 'Tenant not found', { code: 'NOT_FOUND', req });
    }

    const resolvedSlug = toSlug(slug || name || '');
    const previousSlug = tenant.toJSON().slug;
    tenant.update(name, resolvedSlug, domain);

    await repository.update(tenant);

    if (theme !== undefined || themeKey !== undefined) {
      const tenantId = tenant.toJSON().id;
      const existingSettings = await prisma.tenantSettings.findUnique({
        where: { tenantId },
      });
      const existingConfig = extractSectionOrderConfig(existingSettings?.sectionOrder);

      await prisma.tenantSettings.upsert({
        where: { tenantId },
        create: {
          tenantId,
          logoShape: existingSettings?.logoShape || 'circle',
          primaryColor: existingSettings?.primaryColor || '#000000',
          secondaryColor: existingSettings?.secondaryColor || '#FFFFFF',
          businessPhone: existingSettings?.businessPhone,
          businessWhatsApp: existingSettings?.businessWhatsApp,
          tagline: existingSettings?.tagline,
          logoUrl: existingSettings?.logoUrl,
          bannerUrl: existingSettings?.bannerUrl,
          sectionOrder: buildSectionOrderPayload(
            existingConfig.sectionOrder,
            existingConfig.actionButtons,
            existingConfig.galleryCategories,
            existingConfig.fontFamily,
            normalizedTheme,
          ),
        },
        update: {
          sectionOrder: buildSectionOrderPayload(
            existingConfig.sectionOrder,
            existingConfig.actionButtons,
            existingConfig.galleryCategories,
            existingConfig.fontFamily,
            normalizedTheme,
          ),
        },
      });
    }

    invalidatePublicTenantCacheBySlug(previousSlug);
    invalidatePublicTenantCacheBySlug(resolvedSlug);

    return sendSuccess(
      res,
      200,
      {
        ...tenant.toJSON(),
        theme: normalizedTheme,
        themeKey: normalizedTheme,
      },
      req,
    );
  } catch (error: any) {
    const response = getTenantErrorResponse(error);

    return sendError(res, response.status, response.message, { code: 'TENANT_ERROR', req });
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
      return sendError(res, 404, 'Tenant not found', { code: 'NOT_FOUND', req });
    }

    await repository.delete(id);
    invalidatePublicTenantCacheBySlug(tenant.toJSON().slug);

    return sendSuccess(res, 200, { message: 'Tenant deleted successfully' }, req);
  } catch (error: any) {
    const response = getTenantErrorResponse(error);

    return sendError(res, response.status, response.message, { code: 'TENANT_ERROR', req });
  }
});

export default router;
