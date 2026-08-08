import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { OrderRoundService } from '../application/services/order-round.service';
import { PrismaOrderRoundRepository } from '../infrastructure/repositories/prisma-order-round.repository';
import { PrismaCartRepository } from '../infrastructure/repositories/prisma-cart.repository';
import { PrismaMenuRepository } from '../infrastructure/repositories/prisma-menu.repository';
import { PrismaSessionStateGateway } from '../infrastructure/repositories/prisma-session-state.gateway';
import { LoggingDiningEventPublisher } from './dining-event.publisher';
import { mapEntityResponse } from './order-round.dto';

const orderRoundRepository = new PrismaOrderRoundRepository();
const cartRepository = new PrismaCartRepository();
const menuRepository = new PrismaMenuRepository();
const sessionStateGateway = new PrismaSessionStateGateway();
const eventPublisher = new LoggingDiningEventPublisher();
const orderRoundService = new OrderRoundService(
  orderRoundRepository,
  cartRepository,
  menuRepository,
  sessionStateGateway,
  eventPublisher,
);

function parseContext(req: Request) {
  return {
    tenantId: String(req.params.tenantId || req.tenant?.id || req.user?.tenantId || '').trim(),
    locationId: String(req.body?.locationId || req.query.locationId || req.headers['x-location-id'] || '').trim(),
    actorId: req.user?.id ?? null,
    actorRole: req.user?.role ?? null,
  };
}

function parseErrorStatus(message: string): number {
  if (/not found/i.test(message)) {
    return 404;
  }

  if (/permission denied/i.test(message) || /session is closed/i.test(message)) {
    return 403;
  }

  if (/conflict/i.test(message) || /already/i.test(message)) {
    return 409;
  }

  return 400;
}

export class OrderRoundController {
  async createRound(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await orderRoundService.createRound({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorId: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(
        res,
        200,
        mapEntityResponse({
          roundId: result.round.id,
          cartId: result.cart.id,
          roundNumber: result.round.roundNumber,
        }),
        req,
      );
    } catch (error: any) {
      const message = error?.message ?? 'Failed to create round';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async submitRound(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const idempotencyKey = String(req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '').trim();

      const result = await orderRoundService.submitRound({
        roundId: String(req.body?.roundId || req.params.roundId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorId: context.actorId,
        actorRole: context.actorRole,
        idempotencyKey: idempotencyKey || null,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to submit round';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async getSessionOrders(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await orderRoundService.getSessionOrders({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to fetch session orders';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async cancelRound(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await orderRoundService.cancelRound({
        roundId: String(req.body?.roundId || req.params.roundId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorId: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to cancel round';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }
}