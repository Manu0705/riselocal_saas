import { Router } from 'express';
import { LeadController } from './lead.controller';

const router = Router();
const controller = new LeadController();

/* =========================================
   LEAD ROUTES (Multi-Tenant Scoped)
========================================= */

/**
 * Strict upsert entrypoint (DB dedup + session + activity)
 * POST /tenants/:tenantId/leads/upsert
 */
router.post('/tenants/:tenantId/leads/upsert', controller.upsert.bind(controller));
router.post('/tenant/:tenantSlug/leads/upsert', controller.upsert.bind(controller));

/**
 * Backward compatible create route now points to strict upsert flow.
 * POST /tenants/:tenantId/leads
 */
router.post('/tenants/:tenantId/leads', controller.create.bind(controller));

router.post('/tenant/:tenantSlug/leads', controller.create.bind(controller));

/**
 * Update Lead Status
 * PATCH /tenants/:tenantId/leads/:id/status
 */
router.patch('/tenants/:tenantId/leads/:id/status', controller.updateStatus.bind(controller));

router.patch('/tenant/:tenantSlug/leads/:id/status', controller.updateStatus.bind(controller));

/**
 * Set follow-up schedule
 */
router.patch('/tenants/:tenantId/leads/:id/followup', controller.setFollowUp.bind(controller));
router.patch('/tenant/:tenantSlug/leads/:id/followup', controller.setFollowUp.bind(controller));

/**
 * Manual assignment
 */
router.patch('/tenants/:tenantId/leads/:id/assign', controller.assign.bind(controller));
router.patch('/tenant/:tenantSlug/leads/:id/assign', controller.assign.bind(controller));

/**
 * Log CTA activities for existing leads
 */
router.post('/tenants/:tenantId/leads/:id/activity', controller.logActivity.bind(controller));
router.post('/tenant/:tenantSlug/leads/:id/activity', controller.logActivity.bind(controller));

/**
 * Soft delete lead
 */
router.delete('/tenants/:tenantId/leads/:id', controller.softDelete.bind(controller));
router.delete('/tenant/:tenantSlug/leads/:id', controller.softDelete.bind(controller));

/**
 * Get All Leads (Tenant Scoped)
 * GET /tenants/:tenantId/leads
 */
router.get('/tenants/:tenantId/leads', controller.getAll.bind(controller));

router.get('/tenant/:tenantSlug/leads', controller.getAll.bind(controller));

/**
 * Analytics with partition support
 */
router.get('/tenants/:tenantId/leads/analytics', controller.getAnalytics.bind(controller));
router.get('/tenant/:tenantSlug/leads/analytics', controller.getAnalytics.bind(controller));

/**
 * Archive old activities
 */
router.post('/tenants/:tenantId/leads/archive-activities', controller.archiveActivities.bind(controller));
router.post('/tenant/:tenantSlug/leads/archive-activities', controller.archiveActivities.bind(controller));

export default router;
