import { Router } from 'express';
import { requireTenantAndLocation } from './dining.validation';
import { OrderModificationController } from './order-modification.controller';
import {
  requireModificationId,
  requireModificationOrderId,
  requireModificationReason,
  requireOrderItemId,
} from './order-modification.validation';

const router = Router();
const controller = new OrderModificationController();

router.post(
  '/dining/orders/:orderId/modifications',
  requireTenantAndLocation,
  requireModificationOrderId,
  requireModificationReason,
  controller.request.bind(controller),
);

router.post(
  '/dining/modifications/:modificationId/approve',
  requireTenantAndLocation,
  requireModificationId,
  controller.approve.bind(controller),
);

router.post(
  '/dining/modifications/:modificationId/reject',
  requireTenantAndLocation,
  requireModificationId,
  requireModificationReason,
  controller.reject.bind(controller),
);

router.post(
  '/dining/order-items/:orderItemId/cancel',
  requireTenantAndLocation,
  requireOrderItemId,
  requireModificationOrderId,
  requireModificationReason,
  controller.cancelItem.bind(controller),
);

router.get(
  '/dining/orders/:orderId/modifications',
  requireTenantAndLocation,
  requireModificationOrderId,
  controller.history.bind(controller),
);

export default router;
