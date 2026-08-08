import { Router } from 'express';
import { requireTenantAndLocation } from './dining.validation';
import { SessionParticipantController } from './session-participant.controller';
import {
  requireParticipantId,
  requireParticipantSessionId,
  requireParticipantType,
} from './session-participant.validation';

const router = Router();
const controller = new SessionParticipantController();

router.post(
  '/dining/sessions/:sessionId/participants',
  requireTenantAndLocation,
  requireParticipantSessionId,
  requireParticipantType,
  controller.join.bind(controller),
);

router.delete(
  '/dining/sessions/:sessionId/participants/:participantId',
  requireTenantAndLocation,
  requireParticipantSessionId,
  requireParticipantId,
  controller.leave.bind(controller),
);

router.get(
  '/dining/sessions/:sessionId/participants',
  requireTenantAndLocation,
  requireParticipantSessionId,
  controller.list.bind(controller),
);

router.post(
  '/dining/sessions/:sessionId/ownership/transfer',
  requireTenantAndLocation,
  requireParticipantSessionId,
  requireParticipantId,
  controller.transferOwnership.bind(controller),
);

export default router;
