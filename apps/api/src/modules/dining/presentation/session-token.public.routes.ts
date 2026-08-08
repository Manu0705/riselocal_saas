import { Router } from 'express';
import { tenantResolver } from '../../../middleware/tenant-resolver.middleware';
import { SessionTokenController } from './session-token.controller';
import {
  requireDevice,
  requireRole,
  requireSessionTokenTenantAndLocation,
  requireToken,
} from './session-token.validation';

const router = Router();
const controller = new SessionTokenController();

router.post('/dining/session-token/validate', tenantResolver, requireSessionTokenTenantAndLocation, requireToken, controller.validate.bind(controller));
router.post('/dining/session-token/join', tenantResolver, requireSessionTokenTenantAndLocation, requireToken, requireRole, requireDevice, controller.join.bind(controller));
router.post('/dining/session-token/leave', tenantResolver, requireSessionTokenTenantAndLocation, requireToken, requireRole, requireDevice, controller.leave.bind(controller));

export default router;
