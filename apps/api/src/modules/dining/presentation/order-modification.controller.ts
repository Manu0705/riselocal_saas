import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { PrismaOrderModificationRepository } from '../infrastructure/repositories/prisma-order-modification.repository';
import { PrismaSessionStateGateway } from '../infrastructure/repositories/prisma-session-state.gateway';
import { LoggingDiningEventPublisher } from './dining-event.publisher';
import { OrderModificationService } from '../application/services/order-modification.service';

const repository = new PrismaOrderModificationRepository();
const stateGateway = new PrismaSessionStateGateway();
const eventPublisher = new LoggingDiningEventPublisher();
const service = new OrderModificationService(repository, stateGateway, eventPublisher);

function parseContext(req: Request) {
  return {
    tenantId: String(req.params.tenantId || req.tenant?.id || req.user?.tenantId || '').trim(),
    locationId: String(req.body?.locationId || req.query.locationId || req.headers['x-location-id'] || '').trim(),
    actorId: String(req.user?.id || '').trim(),
    actorRole: req.user?.role ?? null,
  };
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

export class OrderModificationController {
  async request(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await service.requestModification({
        orderId: String(req.body?.orderId || req.params.orderId || '').trim(),
        orderItemId: req.body?.orderItemId ? String(req.body.orderItemId) : null,
        tenantId: context.tenantId,
        locationId: context.locationId,
        requestedBy: context.actorId,
        actorRole: context.actorRole,
        reason: String(req.body?.reason || '').trim(),
        adjustmentType: req.body?.adjustmentType ? String(req.body.adjustmentType) : undefined,
        newValue: req.body?.newValue && typeof req.body.newValue === 'object' ? req.body.newValue : null,
        idempotencyKey: String(req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '').trim() || null,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to request modification';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await service.approveModification({
        modificationId: String(req.body?.modificationId || req.params.modificationId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        approvedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to approve modification';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await service.rejectModification({
        modificationId: String(req.body?.modificationId || req.params.modificationId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        rejectedBy: context.actorId,
        actorRole: context.actorRole,
        reason: String(req.body?.reason || '').trim(),
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to reject modification';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async cancelItem(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await service.cancelOrderItem({
        orderItemId: String(req.body?.orderItemId || req.params.orderItemId || '').trim(),
        orderId: String(req.body?.orderId || req.query.orderId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        requestedBy: context.actorId,
        actorRole: context.actorRole,
        reason: String(req.body?.reason || '').trim(),
        idempotencyKey: String(req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '').trim() || null,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to cancel order item';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async history(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await service.listModificationHistory({
        orderId: String(req.body?.orderId || req.params.orderId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, { modifications: result }, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to fetch modification history';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }
}
