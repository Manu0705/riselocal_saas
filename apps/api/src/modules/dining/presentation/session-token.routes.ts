import { Router } from 'express';
import { SessionTokenController } from './session-token.controller';
import {
  requireDevice,
  requireRole,
  requireSessionId,
  requireSessionTokenTenantAndLocation,
  requireToken,
} from './session-token.validation';

const router = Router();
const controller = new SessionTokenController();

router.post('/dining/session-token/generate', requireSessionTokenTenantAndLocation, requireSessionId, controller.generate.bind(controller));
router.post('/dining/session-token/validate', requireSessionTokenTenantAndLocation, requireToken, controller.validate.bind(controller));
router.post('/dining/session-token/join', requireSessionTokenTenantAndLocation, requireToken, requireRole, requireDevice, controller.join.bind(controller));
router.post('/dining/session-token/leave', requireSessionTokenTenantAndLocation, requireToken, requireRole, requireDevice, controller.leave.bind(controller));
router.post('/dining/session-token/regenerate', requireSessionTokenTenantAndLocation, requireSessionId, controller.regenerate.bind(controller));
router.get('/dining/session-token/participants', requireSessionTokenTenantAndLocation, requireSessionId, controller.getParticipants.bind(controller));

export default router;
