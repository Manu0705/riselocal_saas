import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { PrismaOrderLockRepository } from '../infrastructure/repositories/prisma-order-lock.repository';
import { PrismaSessionStateGateway } from '../infrastructure/repositories/prisma-session-state.gateway';
import { LoggingDiningEventPublisher } from './dining-event.publisher';
import { OrderLockService } from '../application/services/order-lock.service';

const repository = new PrismaOrderLockRepository();
const sessionStateGateway = new PrismaSessionStateGateway();
const eventPublisher = new LoggingDiningEventPublisher();
const service = new OrderLockService(repository, sessionStateGateway, eventPublisher);

function parseContext(req: Request) {
  return {
    tenantId: String(req.params.tenantId || req.tenant?.id || req.user?.tenantId || '').trim(),
    locationId: String(req.body?.locationId || req.query.locationId || req.headers['x-location-id'] || '').trim(),
    actorId: req.user?.id ?? null,
    actorRole: req.user?.role ?? null,
    actorDeviceId: String(req.headers['x-device-id'] || req.body?.deviceId || '').trim() || null,
  };
}

function parseErrorStatus(message: string): number {
  if (/not found/i.test(message)) {
    return 404;
  }

  if (/permission denied/i.test(message) || /closed or archived/i.test(message)) {
    return 403;
  }

  if (/conflict/i.test(message) || /version/i.test(message)) {
    return 409;
  }

  return 400;
}

export class OrderLockController {
  async lock(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await service.lockOrder({
        orderId: String(req.body?.orderId || req.params.orderId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        expectedVersion: Number(req.body?.version),
        actorId: context.actorId,
        actorRole: context.actorRole,
        actorDeviceId: context.actorDeviceId,
        reason: req.body?.reason ? String(req.body.reason) : null,
        idempotencyKey: String(req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '').trim() || null,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to lock order';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async requestReopen(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await service.requestReopen({
        orderId: String(req.body?.orderId || req.params.orderId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorId: context.actorId,
        actorRole: context.actorRole,
        reason: req.body?.reason ? String(req.body.reason) : null,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to request reopen';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async reopen(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await service.reopenOrder({
        orderId: String(req.body?.orderId || req.params.orderId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorId: context.actorId,
        actorRole: context.actorRole,
        reason: req.body?.reason ? String(req.body.reason) : null,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to reopen order';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await service.getLockStatus({
        orderId: String(req.body?.orderId || req.params.orderId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to get lock status';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }
}
