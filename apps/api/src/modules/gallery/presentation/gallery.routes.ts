import { Router } from 'express';
import { authMiddleware } from '../../auth/presentation/auth.middleware';
import { prisma } from '@saas/database';

const router = Router();

// GET all gallery images for tenant
router.get('/gallery', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const images = await prisma.galleryImage.findMany({
      where: { tenantId },
      orderBy: [{ category: 'asc' }, { position: 'asc' }],
    });

    return res.json({ success: true, data: images });
  } catch (error: any) {
    console.error('Gallery fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET gallery images by category
router.get('/gallery/category/:category', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const category = req.params.category as string;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const images = await prisma.galleryImage.findMany({
      where: { tenantId, category },
      orderBy: { position: 'asc' },
    });

    return res.json({ success: true, data: images });
  } catch (error: any) {
    console.error('Gallery fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST create gallery image
router.post('/gallery', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const { url, category, position, alt } = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!url || !category) {
      return res.status(400).json({ error: 'URL and category are required' });
    }

    // Get max position for category
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

    return res.status(201).json({ success: true, data: image });
  } catch (error: any) {
    console.error('Gallery create error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// PUT update gallery image
router.put('/gallery/:id', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const imageId = req.params.id as string;
    const { category, position, alt } = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify ownership
    const image = await prisma.galleryImage.findUnique({ where: { id: imageId } });
    if (!image || image.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.galleryImage.update({
      where: { id: imageId },
      data: {
        ...(category && { category }),
        ...(position !== undefined && { position }),
        ...(alt !== undefined && { alt }),
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Gallery update error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// PUT reorder gallery images
router.put('/gallery/reorder', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const items = req.body.items as Array<{ id: string; position: number; category: string }>;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify all items belong to tenant
    const ids = items.map((item) => item.id);
    const existingImages = await prisma.galleryImage.findMany({
      where: { id: { in: ids }, tenantId },
    });

    if (existingImages.length !== items.length) {
      return res.status(403).json({ error: 'Invalid items' });
    }

    // Update all in transaction
    const updated = await Promise.all(
      items.map((item) =>
        prisma.galleryImage.update({
          where: { id: item.id },
          data: { position: item.position, category: item.category },
        }),
      ),
    );

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Gallery reorder error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE gallery image
router.delete('/gallery/:id', authMiddleware, async (req, res) => {
  try {
    const tenantId = (req.user as any)?.tenantId;
    const imageId = req.params.id as string;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify ownership
    const image = await prisma.galleryImage.findUnique({ where: { id: imageId } });
    if (!image || image.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.galleryImage.delete({ where: { id: imageId } });

    return res.json({ success: true, message: 'Image deleted' });
  } catch (error: any) {
    console.error('Gallery delete error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
