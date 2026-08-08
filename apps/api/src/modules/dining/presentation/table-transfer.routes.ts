import { Router } from 'express';
import { requireTenantAndLocation } from './dining.validation';
import { TableTransferController } from './table-transfer.controller';
import {
  requireDestinationTableId,
  requireTransferId,
  requireTransferReason,
  requireTransferSessionId,
} from './table-transfer.validation';

const router = Router();
const controller = new TableTransferController();

router.post(
  '/dining/table-transfer/sessions/:sessionId/transfer',
  requireTenantAndLocation,
  requireTransferSessionId,
  requireDestinationTableId,
  requireTransferReason,
  controller.request.bind(controller),
);

router.post(
  '/dining/table-transfer/transfers/:transferId/approve',
  requireTenantAndLocation,
  requireTransferId,
  controller.approve.bind(controller),
);

router.post(
  '/dining/table-transfer/transfers/:transferId/reject',
  requireTenantAndLocation,
  requireTransferId,
  requireTransferReason,
  controller.reject.bind(controller),
);

router.get(
  '/dining/table-transfer/sessions/:sessionId/table-history',
  requireTenantAndLocation,
  requireTransferSessionId,
  controller.history.bind(controller),
);

export default router;
