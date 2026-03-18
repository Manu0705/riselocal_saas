import { Router } from 'express';
import { LeadController } from './lead.controller';

const router = Router();
const controller = new LeadController();

/* =========================================
   PUBLIC LEAD CAPTURE ROUTES
========================================= */

router.post('/public/tenant/:tenantSlug/leads/upsert', controller.publicUpsert.bind(controller));

export default router;
