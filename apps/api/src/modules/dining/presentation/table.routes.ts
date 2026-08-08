import { Router } from 'express';
import { requireTenantAndLocation } from './dining.validation';
import { TableController } from './table.controller';
import { requireTableId, requireTableStatus, requireWaiterId } from './table.validation';

const router = Router();
const controller = new TableController();

router.get('/dining/tables', requireTenantAndLocation, controller.list.bind(controller));
router.get('/dining/tables/:id', requireTenantAndLocation, requireTableId, controller.get.bind(controller));
router.patch(
  '/dining/tables/:id/status',
  requireTenantAndLocation,
  requireTableId,
  requireTableStatus,
  controller.updateStatus.bind(controller),
);
router.patch(
  '/dining/tables/:id/waiter',
  requireTenantAndLocation,
  requireTableId,
  requireWaiterId,
  controller.assignWaiter.bind(controller),
);
router.post('/dining/tables/:id/clean', requireTenantAndLocation, requireTableId, controller.clean.bind(controller));
router.post(
  '/dining/tables/:id/maintenance',
  requireTenantAndLocation,
  requireTableId,
  controller.maintenance.bind(controller),
);
router.post(
  '/dining/tables/:id/maintenance/restore',
  requireTenantAndLocation,
  requireTableId,
  controller.restoreMaintenance.bind(controller),
);

export default router;