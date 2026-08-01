import { Router } from 'express';
import { authMiddleware } from '../../auth/presentation/auth.middleware';
import { prisma } from '@saas/database';
import { invalidatePublicTenantCacheByTenantId } from '../../tenant/infrastructure/public-tenant-cache';
import { sendError } from '../../../shared/http/api-response';

const router = Router();

// GET all gallery images for tenant
router.get('/gallery', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    if (!tenantId) {
      return sendError(res, 401, 'Unauthorized', { code: 'UNAUTHORIZED', req });
    }

    const images = await prisma.galleryImage.findMany({
      where: { tenantId },
      orderBy: [{ category: 'asc' }, { position: 'asc' }],
    });

    return res.json({ success: true, data: images });
  } catch (error: any) {
    console.error('Gallery fetch error:', error);
    return sendError(res, 500, error.message || 'Failed to fetch gallery', {
      code: 'GALLERY_FETCH_FAILED',
      req,
    });
  }
});

// GET gallery images by category
router.get('/gallery/category/:category', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const category = req.params.category as string;

    if (!tenantId) {
      return sendError(res, 401, 'Unauthorized', { code: 'UNAUTHORIZED', req });
    }

    const images = await prisma.galleryImage.findMany({
      where: { tenantId, category },
      orderBy: { position: 'asc' },
    });

    return res.json({ success: true, data: images });
  } catch (error: any) {
    console.error('Gallery fetch error:', error);
    return sendError(res, 500, error.message || 'Failed to fetch gallery', {
      code: 'GALLERY_FETCH_FAILED',
      req,
    });
  }
});

// POST create gallery image
router.post('/gallery', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const { url, category, position, alt } = req.body;

    if (!tenantId) {
      return sendError(res, 401, 'Unauthorized', { code: 'UNAUTHORIZED', req });
    }

    if (!url || !category) {
      return sendError(res, 400, 'URL and category are required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    const maxPosition = await prisma.galleryImage.findFirst({
      where: { tenantId, category },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newPosition = (maxPosition?.position ?? -1) + 1;

    const image = await prisma.galleryImage.create({
      data: {
        tenantId,
        url,
        category,
        position: position ?? newPosition,
        alt,
      },
    });

    await invalidatePublicTenantCacheByTenantId(tenantId);
    return res.status(201).json({ success: true, data: image });
  } catch (error: any) {
    console.error('Gallery create error:', error);
    return sendError(res, 500, error.message || 'Failed to create gallery image', {
      code: 'GALLERY_CREATE_FAILED',
      req,
    });
  }
});

// PUT reorder gallery images — must be registered BEFORE /gallery/:id
router.put('/gallery/reorder', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const items = req.body.items as Array<{ id: string; position: number; category: string }>;

    if (!tenantId) {
      return sendError(res, 401, 'Unauthorized', { code: 'UNAUTHORIZED', req });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, 'items array is required', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }

    const ids = items.map((item) => item.id);
    const existingImages = await prisma.galleryImage.findMany({
      where: { id: { in: ids }, tenantId },
    });

    if (existingImages.length !== items.length) {
      return sendError(res, 403, 'Invalid items', { code: 'FORBIDDEN', req });
    }

    const updated = await Promise.all(
      items.map((item) =>
        prisma.galleryImage.update({
          where: { id: item.id },
          data: { position: item.position, category: item.category },
        }),
      ),
    );

    await invalidatePublicTenantCacheByTenantId(tenantId);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Gallery reorder error:', error);
    return sendError(res, 500, error.message || 'Failed to reorder gallery', {
      code: 'GALLERY_REORDER_FAILED',
      req,
    });
  }
});

// PUT update gallery image
router.put('/gallery/:id', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const imageId = req.params.id as string;
    const { category, position, alt } = req.body;

    if (!tenantId) {
      return sendError(res, 401, 'Unauthorized', { code: 'UNAUTHORIZED', req });
    }

    const image = await prisma.galleryImage.findUnique({ where: { id: imageId } });
    if (!image || image.tenantId !== tenantId) {
      return sendError(res, 403, 'Forbidden', { code: 'FORBIDDEN', req });
    }

    const updated = await prisma.galleryImage.update({
      where: { id: imageId },
      data: {
        ...(category && { category }),
        ...(position !== undefined && { position }),
        ...(alt !== undefined && { alt }),
      },
    });

    await invalidatePublicTenantCacheByTenantId(tenantId);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Gallery update error:', error);
    return sendError(res, 500, error.message || 'Failed to update gallery image', {
      code: 'GALLERY_UPDATE_FAILED',
      req,
    });
  }
});

// DELETE gallery image
router.delete('/gallery/:id', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const imageId = req.params.id as string;

    if (!tenantId) {
      return sendError(res, 401, 'Unauthorized', { code: 'UNAUTHORIZED', req });
    }

    const image = await prisma.galleryImage.findUnique({ where: { id: imageId } });
    if (!image || image.tenantId !== tenantId) {
      return sendError(res, 403, 'Forbidden', { code: 'FORBIDDEN', req });
    }

    await prisma.galleryImage.delete({ where: { id: imageId } });
    await invalidatePublicTenantCacheByTenantId(tenantId);

    return res.json({ success: true, message: 'Image deleted' });
  } catch (error: any) {
    console.error('Gallery delete error:', error);
    return sendError(res, 500, error.message || 'Failed to delete gallery image', {
      code: 'GALLERY_DELETE_FAILED',
      req,
    });
  }
});

export default router;
