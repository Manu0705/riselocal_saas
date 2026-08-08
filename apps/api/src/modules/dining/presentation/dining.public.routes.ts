import { Router } from 'express';
import { tenantResolver } from '../../../middleware/tenant-resolver.middleware';
import { DiningController } from './dining.controller';
import { requireTenantAndLocation } from './dining.validation';

const router = Router();
const controller = new DiningController();

router.get('/menus/public', tenantResolver, requireTenantAndLocation, controller.getPublicMenus.bind(controller));

export default router;
