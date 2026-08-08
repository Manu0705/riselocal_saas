import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { SessionParticipantService } from '../application/services/session-participant.service';
import { PrismaSessionParticipantRepository } from '../infrastructure/repositories/prisma-session-participant.repository';
import { LoggingDiningEventPublisher } from './dining-event.publisher';

const repository = new PrismaSessionParticipantRepository();
const eventPublisher = new LoggingDiningEventPublisher();
const participantService = new SessionParticipantService(repository, eventPublisher);

function parseContext(req: Request) {
  return {
    tenantId: String(req.params.tenantId || req.tenant?.id || req.user?.tenantId || '').trim(),
    locationId: String(req.body?.locationId || req.query.locationId || req.headers['x-location-id'] || '').trim(),
    actorId: String(req.user?.id || '').trim(),
    actorRole: req.user?.role ?? null,
  };
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }

  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  return undefined;
}

function parseErrorStatus(message: string): number {
  if (/not found/i.test(message)) {
    return 404;
  }

  if (/permission denied/i.test(message) || /closed or archived/i.test(message)) {
    return 403;
  }

  if (/conflict/i.test(message)) {
    return 409;
  }

  return 400;
}

export class SessionParticipantController {
  async join(req: Request, res: Response) {
    try {
      const context = parseContext(req);

      const result = await participantService.joinParticipant({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorId: context.actorId,
        actorRole: context.actorRole,
        participantType: String(req.body?.participantType || req.body?.type || '').trim(),
        displayName: req.body?.displayName ? String(req.body.displayName) : null,
        deviceId: req.body?.deviceId ? String(req.body.deviceId) : null,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to join participant';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async leave(req: Request, res: Response) {
    try {
      const context = parseContext(req);

      const result = await participantService.leaveParticipant({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        participantId: String(req.body?.participantId || req.params.participantId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorId: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to leave participant';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const context = parseContext(req);

      const result = await participantService.listParticipants({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        includeLeft: parseBoolean(req.query.includeLeft ?? req.body?.includeLeft),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, { participants: result }, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to list participants';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async transferOwnership(req: Request, res: Response) {
    try {
      const context = parseContext(req);

      const result = await participantService.transferOwnership({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        participantId: String(req.body?.participantId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorId: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to transfer ownership';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }
}
