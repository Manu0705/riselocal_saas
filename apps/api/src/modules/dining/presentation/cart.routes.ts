import { Router } from 'express';
import { CartController } from './cart.controller';
import { requireTenantAndLocation } from './dining.validation';
import { requireCartItemId, requireCartMenuItemId, requireCartQuantity, requireCartSessionId } from './cart.validation';

const router = Router();
const controller = new CartController();

router.get('/dining/cart/sessions/:sessionId/cart', requireTenantAndLocation, requireCartSessionId, controller.getActive.bind(controller));
router.post(
  '/dining/cart/sessions/:sessionId/cart/items',
  requireTenantAndLocation,
  requireCartSessionId,
  requireCartMenuItemId,
  requireCartQuantity,
  controller.addItem.bind(controller),
);
router.patch('/dining/cart/items/:itemId', requireTenantAndLocation, requireCartItemId, controller.updateItem.bind(controller));
router.delete('/dining/cart/items/:itemId', requireTenantAndLocation, requireCartItemId, controller.removeItem.bind(controller));
router.post('/dining/cart/sessions/:sessionId/cart/submit', requireTenantAndLocation, requireCartSessionId, controller.submit.bind(controller));

export default router;