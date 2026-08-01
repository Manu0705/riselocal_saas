import { Router } from 'express';
import { authMiddleware } from '../../auth/presentation/auth.middleware';
import { prisma } from '@saas/database';
import { invalidatePublicTenantCacheByTenantId } from '../../tenant/infrastructure/public-tenant-cache';
import { sendError, sendSuccess } from '../../../shared/http/api-response';

const router = Router();

// SERVICES ROUTES

// GET all services
router.get('/services', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    if (!tenantId) {
      return sendError(res, 401, 'Unauthorized', { code: 'UNAUTHORIZED', req });
    }

    const services = await prisma.service.findMany({
      where: { tenantId },
      orderBy: { position: 'asc' },
    });

    return sendSuccess(res, 200, services, req);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal error', { code: 'INTERNAL_ERROR', req });
  }
});

// POST create service
router.post('/services', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const { name, description, icon } = req.body;

    if (!tenantId || !name) {
      return sendError(res, 400, 'Tenant and name are required', { code: 'VALIDATION_ERROR', req });
    }

    const maxPosition = await prisma.service.findFirst({
      where: { tenantId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const service = await prisma.service.create({
      data: {
        tenantId,
        name,
        description,
        icon,
        position: (maxPosition?.position ?? -1) + 1,
      },
    });

    await invalidatePublicTenantCacheByTenantId(tenantId);
    return sendSuccess(res, 201, service, req);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal error', { code: 'INTERNAL_ERROR', req });
  }
});

// PUT update service
router.put('/services/:id', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const serviceId = req.params.id as string;
    const { name, description, icon, position } = req.body;

    // Verify ownership
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.tenantId !== tenantId) {
      return sendError(res, 403, 'Forbidden', { code: 'FORBIDDEN', req });
    }

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(position !== undefined && { position }),
      },
    });

    await invalidatePublicTenantCacheByTenantId(tenantId);
    return sendSuccess(res, 200, updated, req);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal error', { code: 'INTERNAL_ERROR', req });
  }
});

// DELETE service
router.delete('/services/:id', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const serviceId = req.params.id as string;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.tenantId !== tenantId) {
      return sendError(res, 403, 'Forbidden', { code: 'FORBIDDEN', req });
    }

    await prisma.service.delete({ where: { id: serviceId } });
    await invalidatePublicTenantCacheByTenantId(tenantId);
    return sendSuccess(res, 200, { message: 'Service deleted' }, req);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal error', { code: 'INTERNAL_ERROR', req });
  }
});

// SOCIAL LINKS ROUTES

// GET all social links
router.get('/social', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    if (!tenantId) {
      return sendError(res, 401, 'Unauthorized', { code: 'UNAUTHORIZED', req });
    }

    const links = await prisma.socialLink.findMany({
      where: { tenantId },
    });

    return sendSuccess(res, 200, links, req);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal error', { code: 'INTERNAL_ERROR', req });
  }
});

// POST create social link
router.post('/social', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const { platform, url, label } = req.body;

    if (!tenantId || !platform || !url) {
      return sendError(res, 400, 'Platform and URL are required', { code: 'VALIDATION_ERROR', req });
    }

    const link = await prisma.socialLink.create({
      data: {
        tenantId,
        platform,
        url,
        label,
      },
    });

    await invalidatePublicTenantCacheByTenantId(tenantId);
    return sendSuccess(res, 201, link, req);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal error', { code: 'INTERNAL_ERROR', req });
  }
});

// PUT update social link
router.put('/social/:id', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const linkId = req.params.id as string;
    const { url, label } = req.body;

    const link = await prisma.socialLink.findUnique({ where: { id: linkId } });
    if (!link || link.tenantId !== tenantId) {
      return sendError(res, 403, 'Forbidden', { code: 'FORBIDDEN', req });
    }

    const updated = await prisma.socialLink.update({
      where: { id: linkId },
      data: {
        ...(url && { url }),
        ...(label !== undefined && { label }),
      },
    });

    await invalidatePublicTenantCacheByTenantId(tenantId);
    return sendSuccess(res, 200, updated, req);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal error', { code: 'INTERNAL_ERROR', req });
  }
});

// DELETE social link
router.delete('/social/:id', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const linkId = req.params.id as string;

    const link = await prisma.socialLink.findUnique({ where: { id: linkId } });
    if (!link || link.tenantId !== tenantId) {
      return sendError(res, 403, 'Forbidden', { code: 'FORBIDDEN', req });
    }

    await prisma.socialLink.delete({ where: { id: linkId } });
    await invalidatePublicTenantCacheByTenantId(tenantId);
    return sendSuccess(res, 200, { message: 'Social link deleted' }, req);
  } catch (error: any) {
    return sendError(res, 500, error.message || 'Internal error', { code: 'INTERNAL_ERROR', req });
  }
});

export default router;
