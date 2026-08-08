import { Router } from 'express';
import { DiningController } from './dining.controller';
import cartRoutes from './cart.routes';
import orderLockRoutes from './order-lock.routes';
import orderModificationRoutes from './order-modification.routes';
import orderRoundRoutes from './order-round.routes';
import sessionParticipantRoutes from './session-participant.routes';
import tableRoutes from './table.routes';
import tableTransferRoutes from './table-transfer.routes';
import tableGroupRoutes from './table-group.routes';
import {
  requireCategoryId,
  requireItemId,
  requireMenuId,
  requireTenantAndLocation,
  requireVariantItemId,
  requireVariantId,
} from './dining.validation';

const router = Router();
const controller = new DiningController();

router.post('/menus', requireTenantAndLocation, controller.createMenu.bind(controller));
router.patch('/menus/:id', requireTenantAndLocation, controller.updateMenu.bind(controller));

router.post('/categories', requireTenantAndLocation, requireMenuId, controller.createCategory.bind(controller));
router.patch(
  '/categories/:id',
  requireTenantAndLocation,
  requireCategoryId,
  requireMenuId,
  controller.updateCategory.bind(controller),
);
router.delete(
  '/categories/:id',
  requireTenantAndLocation,
  requireCategoryId,
  requireMenuId,
  controller.deleteCategory.bind(controller),
);

router.post('/items', requireTenantAndLocation, requireMenuId, controller.createItem.bind(controller));
router.patch('/items/:id', requireTenantAndLocation, requireItemId, requireMenuId, controller.updateItem.bind(controller));
router.patch(
  '/items/:id/availability',
  requireTenantAndLocation,
  requireItemId,
  requireMenuId,
  controller.updateItemAvailability.bind(controller),
);

router.post(
  '/items/:id/variants',
  requireTenantAndLocation,
  requireItemId,
  requireMenuId,
  controller.createItemVariant.bind(controller),
);
router.delete(
  '/variants/:id',
  requireTenantAndLocation,
  requireVariantId,
  requireVariantItemId,
  requireMenuId,
  controller.deleteVariant.bind(controller),
);
router.post(
  '/items/:id/addons',
  requireTenantAndLocation,
  requireItemId,
  requireMenuId,
  controller.createItemAddon.bind(controller),
);
router.post(
  '/items/:id/modifiers',
  requireTenantAndLocation,
  requireItemId,
  requireMenuId,
  controller.createItemModifier.bind(controller),
);

router.use(tableRoutes);
router.use(cartRoutes);
router.use(orderRoundRoutes);
router.use(orderLockRoutes);
router.use(orderModificationRoutes);
router.use(sessionParticipantRoutes);
router.use(tableTransferRoutes);
router.use(tableGroupRoutes);

export default router;
