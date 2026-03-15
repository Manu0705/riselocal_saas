import { Router } from 'express';
import { FeedbackController } from './feedback.controller';

const router = Router();
const controller = new FeedbackController();

/* =====================================================
   TENANT-SCOPED ROUTES
   (Multi-Tenant Safe)
===================================================== */

/**
 * Create feedback for a tenant
 * POST /tenants/:tenantId/feedback
 */
router.post('/tenants/:tenantId/feedback', controller.create.bind(controller));

router.post('/tenant/:tenantSlug/feedback', controller.create.bind(controller));

/**
 * List all feedback for a tenant
 * GET /tenants/:tenantId/feedback
 */
router.get('/tenants/:tenantId/feedback', controller.listByTenant.bind(controller));

router.get('/tenant/:tenantSlug/feedback', controller.listByTenant.bind(controller));

/**
 * List pending feedback (moderation)
 * GET /tenants/:tenantId/feedback/pending
 */
router.get('/tenants/:tenantId/feedback/pending', controller.listPending.bind(controller));

router.get('/tenant/:tenantSlug/feedback/pending', controller.listPending.bind(controller));

/* =====================================================
   MODERATION ROUTES
===================================================== */

/**
 * Approve feedback
 * PATCH /feedback/:id/approve
 */
router.patch('/feedback/:id/approve', controller.approve.bind(controller));

/**
 * Reject feedback
 * PATCH /feedback/:id/reject
 */
router.patch('/feedback/:id/reject', controller.reject.bind(controller));

export default router;
