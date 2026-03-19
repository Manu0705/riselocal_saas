import { Router, Request, Response, NextFunction } from 'express';
import { FeedbackController } from './feedback.controller';
import { PrismaTenantRepository } from '../../tenant/infrastructure/tenant.prisma.repository';

const router = Router();
const controller = new FeedbackController();
const tenantRepository = new PrismaTenantRepository();

/** Resolves :tenantSlug (which may be a slug or UUID) into req.params.tenantId */
async function resolveSlugToTenantId(req: Request, res: Response, next: NextFunction) {
  try {
    const slugOrId = req.params.tenantSlug as string;
    const tenant = await tenantRepository.findBySlug(slugOrId);
    req.params.tenantId = tenant ? tenant.toJSON().id : slugOrId;
    next();
  } catch (err) {
    next(err);
  }
}

/* =====================================================
   TENANT-SCOPED ROUTES
   (Multi-Tenant Safe)
===================================================== */

/**
 * Create feedback for a tenant
 * POST /tenants/:tenantId/feedback
 */
router.post('/tenants/:tenantId/feedback', controller.create.bind(controller));

router.post('/tenant/:tenantSlug/feedback', resolveSlugToTenantId, controller.create.bind(controller));

/**
 * List all feedback for a tenant
 * GET /tenants/:tenantId/feedback
 */
router.get('/tenants/:tenantId/feedback', controller.listByTenant.bind(controller));

router.get('/tenant/:tenantSlug/feedback', resolveSlugToTenantId, controller.listByTenant.bind(controller));

/**
 * List pending feedback (moderation)
 * GET /tenants/:tenantId/feedback/pending
 */
router.get('/tenants/:tenantId/feedback/pending', controller.listPending.bind(controller));

router.get('/tenant/:tenantSlug/feedback/pending', resolveSlugToTenantId, controller.listPending.bind(controller));

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
