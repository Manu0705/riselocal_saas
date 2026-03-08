import { Router } from "express";
import { LeadController } from "./lead.controller";

const router = Router();
const controller = new LeadController();

/* =========================================
   LEAD ROUTES (Multi-Tenant Scoped)
========================================= */

/**
 * Create Lead
 * POST /tenants/:tenantId/leads
 */
router.post(
  "/tenants/:tenantId/leads",
  controller.create.bind(controller)
);

router.post(
  "/tenant/:tenantSlug/leads",
  controller.create.bind(controller)
);

/**
 * Update Lead Status
 * PATCH /tenants/:tenantId/leads/:id/status
 */
router.patch(
  "/tenants/:tenantId/leads/:id/status",
  controller.updateStatus.bind(controller)
);

router.patch(
  "/tenant/:tenantSlug/leads/:id/status",
  controller.updateStatus.bind(controller)
);

/**
 * Get All Leads (Tenant Scoped)
 * GET /tenants/:tenantId/leads
 */
router.get(
  "/tenants/:tenantId/leads",
  controller.getAll.bind(controller)
);

router.get(
  "/tenant/:tenantSlug/leads",
  controller.getAll.bind(controller)
);

export default router;