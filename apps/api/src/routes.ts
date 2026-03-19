import { Router } from 'express';
import tenantRoutes from './modules/tenant/presentation/tenant.routes';
import leadRoutes from './modules/lead/presentation/lead.routes';
import leadPublicRoutes from './modules/lead/presentation/lead.public.routes';
import feedbackRoutes from './modules/feedback/presentation/feedback.routes';
import feedbackPublicRoutes from './modules/feedback/presentation/feedback.public.routes';
import { authMiddleware } from './modules/auth/presentation/auth.middleware';
import authRoutes from './modules/auth/presentation/auth.routes';
import tenantUserRoutes from './modules/tenant/presentation/tenant-user.routes';
import { tenantContextMiddleware } from './middleware/tenant-context.middleware';
import { tenantAccessMiddleware } from './middleware/tenant-access.middleware';
import uploadRoutes from './modules/upload/presentation/upload.routes';
import galleryRoutes from './modules/gallery/presentation/gallery.routes';
import tenantSettingsRoutes from './modules/tenant/presentation/tenant-settings.routes';
import contentRoutes from './modules/content/presentation/content.routes';

const router = Router();

/* =========================================
   PUBLIC ROUTES
========================================= */

router.use('/auth', authRoutes);
router.use(tenantRoutes);
router.use(tenantUserRoutes);
router.use(leadPublicRoutes);
router.use(feedbackPublicRoutes);

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
router.use(uploadRoutes);
router.use(galleryRoutes);
router.use(tenantSettingsRoutes);
router.use(contentRoutes);

export default router;
