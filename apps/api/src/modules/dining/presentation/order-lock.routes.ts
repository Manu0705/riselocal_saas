import { Router } from 'express';
import { requireTenantAndLocation } from './dining.validation';
import { OrderLockController } from './order-lock.controller';
import { requireOrderId, requireOrderVersion } from './order-lock.validation';

const router = Router();
const controller = new OrderLockController();

router.post('/dining/orders/:orderId/lock', requireTenantAndLocation, requireOrderId, requireOrderVersion, controller.lock.bind(controller));
router.post('/dining/orders/:orderId/reopen-request', requireTenantAndLocation, requireOrderId, controller.requestReopen.bind(controller));
router.post('/dining/orders/:orderId/reopen', requireTenantAndLocation, requireOrderId, controller.reopen.bind(controller));
router.get('/dining/orders/:orderId/lock', requireTenantAndLocation, requireOrderId, controller.getStatus.bind(controller));

export default router;
