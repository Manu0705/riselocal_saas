import { Router } from 'express';
import { requireTenantAndLocation } from './dining.validation';
import { TableGroupController } from './table-group.controller';
import { requireGroupId, requireMergeId, requireMergeReason, requireTableIds } from './table-group.validation';

const router = Router();
const controller = new TableGroupController();

router.post(
  '/dining/table-groups/merge',
  requireTenantAndLocation,
  requireTableIds,
  requireMergeReason,
  controller.requestMerge.bind(controller),
);

router.post(
  '/dining/table-groups/merge/:mergeId/approve',
  requireTenantAndLocation,
  requireMergeId,
  controller.approveMerge.bind(controller),
);

router.post(
  '/dining/table-groups/groups/:groupId/release',
  requireTenantAndLocation,
  requireGroupId,
  controller.releaseGroup.bind(controller),
);

export default router;
