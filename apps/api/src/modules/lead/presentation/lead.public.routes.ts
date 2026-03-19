import { Router } from 'express';
import { LeadController } from './lead.controller';

const router = Router();
const controller = new LeadController();

/* =========================================
   PUBLIC LEAD CAPTURE ROUTES
========================================= */

router.post('/public/tenant/:tenantSlug/leads/upsert', controller.publicUpsert.bind(controller));
router.get('/public/tenant/:tenantSlug/leads/:id', controller.publicGetLead.bind(controller));

export default router;
