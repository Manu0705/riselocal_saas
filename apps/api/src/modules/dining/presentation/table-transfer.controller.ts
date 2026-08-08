import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { PrismaTableTransferRepository } from '../infrastructure/repositories/prisma-table-transfer.repository';
import { LoggingDiningEventPublisher } from './dining-event.publisher';
import { TableTransferService } from '../application/services/table-transfer.service';

const repository = new PrismaTableTransferRepository();
const eventPublisher = new LoggingDiningEventPublisher();
const transferService = new TableTransferService(repository, eventPublisher);

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

  if (/permission denied/i.test(message) || /manager approval required/i.test(message)) {
    return 403;
  }

  if (/conflict/i.test(message) || /already/i.test(message)) {
    return 409;
  }

  return 400;
}

export class TableTransferController {
  async request(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await transferService.requestTransfer({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        destinationTableId: String(req.body?.destinationTableId || '').trim(),
        reason: String(req.body?.reason || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        requestedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to request transfer';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await transferService.approveTransfer({
        transferId: String(req.body?.transferId || req.params.transferId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        approvedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to approve transfer';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await transferService.rejectTransfer({
        transferId: String(req.body?.transferId || req.params.transferId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        rejectedBy: context.actorId,
        actorRole: context.actorRole,
        reason: String(req.body?.reason || '').trim(),
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to reject transfer';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async history(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await transferService.getSessionHistory({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to fetch transfer history';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }
}
