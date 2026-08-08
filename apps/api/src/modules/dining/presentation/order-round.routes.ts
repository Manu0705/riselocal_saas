import { Router } from 'express';
import { requireTenantAndLocation } from './dining.validation';
import { OrderRoundController } from './order-round.controller';
import { requireOrderRoundId, requireOrderSessionId } from './order-round.validation';

const router = Router();
const controller = new OrderRoundController();

router.post(
  '/dining/orders/sessions/:sessionId/rounds',
  requireTenantAndLocation,
  requireOrderSessionId,
  controller.createRound.bind(controller),
);
router.post(
  '/dining/orders/rounds/:roundId/submit',
  requireTenantAndLocation,
  requireOrderRoundId,
  controller.submitRound.bind(controller),
);
router.get(
  '/dining/orders/sessions/:sessionId/orders',
  requireTenantAndLocation,
  requireOrderSessionId,
  controller.getSessionOrders.bind(controller),
);
router.post(
  '/dining/orders/rounds/:roundId/cancel',
  requireTenantAndLocation,
  requireOrderRoundId,
  controller.cancelRound.bind(controller),
);

export default router;