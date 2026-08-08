import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { SessionTokenService } from '../application/services/session-token.service';
import { mapEntityResponse } from './dining.dto';
import {
  mapGenerateTokenRequest,
  mapGetParticipantsRequest,
  mapJoinSessionRequest,
  mapLeaveSessionRequest,
  mapRegenerateTokenRequest,
  mapSessionTokenContext,
  mapValidateTokenRequest,
} from './session-token.mapper';
import { LoggingDiningEventPublisher } from './dining-event.publisher';
import { PrismaSessionStateGateway } from '../infrastructure/repositories/prisma-session-state.gateway';
import { PrismaSessionTokenRepository } from '../infrastructure/repositories/prisma-session-token.repository';

const repository = new PrismaSessionTokenRepository();
const eventPublisher = new LoggingDiningEventPublisher();
const stateGateway = new PrismaSessionStateGateway();
const sessionTokenService = new SessionTokenService(repository, eventPublisher, stateGateway);

function parseOptionalDate(raw: string | undefined): Date | undefined {
  if (!raw) {
    return undefined;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid expiresAt value');
  }

  return parsed;
}

export class SessionTokenController {
  async generate(req: Request, res: Response) {
    try {
      const context = mapSessionTokenContext(req);
      const dto = mapGenerateTokenRequest(req);

      const result = await sessionTokenService.generateToken({
        sessionId: dto.sessionId,
        tenantId: context.tenantId,
        locationId: context.locationId,
        createdBy: context.actorId,
        expiresAt: parseOptionalDate(dto.expiresAt),
        joinBaseUrl: dto.joinBaseUrl,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to generate session token', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async validate(req: Request, res: Response) {
    try {
      const context = mapSessionTokenContext(req);
      const dto = mapValidateTokenRequest(req);

      const result = await sessionTokenService.validateToken({
        token: dto.token,
        tenantId: context.tenantId,
        locationId: context.locationId,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to validate session token', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async join(req: Request, res: Response) {
    try {
      const context = mapSessionTokenContext(req);
      const dto = mapJoinSessionRequest(req);

      const result = await sessionTokenService.joinSession({
        token: dto.token,
        role: dto.role,
        deviceId: dto.deviceId,
        displayName: dto.displayName,
        actorId: context.actorId,
        tenantId: context.tenantId,
        locationId: context.locationId,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to join session', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async leave(req: Request, res: Response) {
    try {
      const context = mapSessionTokenContext(req);
      const dto = mapLeaveSessionRequest(req);

      const result = await sessionTokenService.leaveSession({
        token: dto.token,
        role: dto.role,
        deviceId: dto.deviceId,
        tenantId: context.tenantId,
        locationId: context.locationId,
      });

      return sendSuccess(
        res,
        200,
        mapEntityResponse((result ?? { left: false }) as unknown as Record<string, unknown>),
        req,
      );
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to leave session', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async regenerate(req: Request, res: Response) {
    try {
      const context = mapSessionTokenContext(req);
      const dto = mapRegenerateTokenRequest(req);

      const result = await sessionTokenService.regenerateToken({
        sessionId: dto.sessionId,
        regeneratedBy: context.actorId,
        tenantId: context.tenantId,
        locationId: context.locationId,
        expiresAt: parseOptionalDate(dto.expiresAt),
        joinBaseUrl: dto.joinBaseUrl,
      });

      return sendSuccess(res, 200, mapEntityResponse(result), req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to regenerate session token', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async getParticipants(req: Request, res: Response) {
    try {
      const context = mapSessionTokenContext(req);
      const dto = mapGetParticipantsRequest(req);

      const result = await sessionTokenService.getParticipants({
        sessionId: dto.sessionId,
        includeLeft: dto.includeLeft,
        tenantId: context.tenantId,
        locationId: context.locationId,
      });

      return sendSuccess(res, 200, mapEntityResponse({ participants: result }), req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to fetch participants', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }
}
