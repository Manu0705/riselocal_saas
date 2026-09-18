import { Router } from 'express';
import { prisma } from '@saas/database';
import tenantRoutes from './modules/tenant/presentation/tenant.routes';
import leadRoutes from './modules/lead/presentation/lead.routes';
import leadPublicRoutes from './modules/lead/presentation/lead.public.routes';
import feedbackRoutes from './modules/feedback/presentation/feedback.routes';
import feedbackPublicRoutes from './modules/feedback/presentation/feedback.public.routes';
import diningRoutes from './modules/dining/presentation/dining.routes';
import diningPublicRoutes from './modules/dining/presentation/dining.public.routes';
import sessionTokenRoutes from './modules/dining/presentation/session-token.routes';
import sessionTokenPublicRoutes from './modules/dining/presentation/session-token.public.routes';
import { authMiddleware } from './modules/auth/presentation/auth.middleware';
import authRoutes from './modules/auth/presentation/auth.routes';
import tenantUserRoutes from './modules/tenant/presentation/tenant-user.routes';
import { tenantContextMiddleware } from './middleware/tenant-context.middleware';
import { tenantAccessMiddleware } from './middleware/tenant-access.middleware';
import uploadRoutes from './modules/upload/presentation/upload.routes';
import galleryRoutes from './modules/gallery/presentation/gallery.routes';
import tenantSettingsRoutes from './modules/tenant/presentation/tenant-settings.routes';
import contentRoutes from './modules/content/presentation/content.routes';
import hostelRoutes from './modules/hostel/presentation/hostel.routes';
import { sendError, sendSuccess } from './shared/http/api-response';
import { HostelController } from './modules/hostel/presentation/hostel.controller';

const router = Router();
const hostelController = new HostelController();

router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, 200, { status: 'ok', database: 'ok' }, req);
  } catch (error: unknown) {
    console.error('Database health check failed', error);
    return sendError(res, 500, 'Database connectivity check failed', {
      code: 'INTERNAL_ERROR',
      req,
    });
  }
});

/* =========================================
   PUBLIC ROUTES
========================================= */

router.use('/auth', authRoutes);
router.use(tenantRoutes);
router.use(tenantUserRoutes);
router.use(leadPublicRoutes);
router.use(feedbackPublicRoutes);
router.use(diningPublicRoutes);
router.use(sessionTokenPublicRoutes);

router.post(
  '/hostel/student/login',
  hostelController.studentLogin.bind(hostelController),
);

/* =========================================
   AUTH PROTECTED ROUTES
========================================= */

router.use(authMiddleware);
router.use(tenantContextMiddleware);
router.use(tenantAccessMiddleware);

/* =========================================
   MODULE ROUTES
========================================= */

router.use(leadRoutes);
router.use(feedbackRoutes);
router.use(diningRoutes);
router.use(sessionTokenRoutes);
router.use(uploadRoutes);
router.use(galleryRoutes);
router.use(tenantSettingsRoutes);
router.use(contentRoutes);
router.use(hostelRoutes);

export default router;
