import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { TableService } from '../application/services/table.service';
import { mapEntityResponse } from './table.dto';
import { PrismaTableRepository } from '../infrastructure/repositories/prisma-table.repository';
import { LoggingDiningEventPublisher } from './dining-event.publisher';

const repository = new PrismaTableRepository();
const eventPublisher = new LoggingDiningEventPublisher();
const tableService = new TableService(repository, eventPublisher);

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

  if (/permission denied/i.test(message)) {
    return 403;
  }

  if (/conflict/i.test(message)) {
    return 409;
  }

  return 400;
}

export class TableController {
  async list(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await tableService.listTables({
        tenantId: context.tenantId,
        locationId: context.locationId,
        status: req.query.status ? String(req.query.status) : undefined,
      });

      return sendSuccess(res, 200, { tables: result }, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to fetch tables';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await tableService.getTable({
        tableId: String(req.body?.tableId || req.params.id || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to fetch table';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await tableService.updateStatus({
        tableId: String(req.body?.tableId || req.params.id || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        status: String(req.body?.status || '').trim(),
        activeSessionId: req.body?.activeSessionId ? String(req.body.activeSessionId).trim() : undefined,
        changedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to update table status';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async assignWaiter(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await tableService.assignWaiter({
        tableId: String(req.body?.tableId || req.params.id || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        waiterId: String(req.body?.waiterId || '').trim(),
        assignedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to assign waiter';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async clean(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await tableService.markCleaned({
        tableId: String(req.body?.tableId || req.params.id || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        status: 'AVAILABLE',
        changedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to mark table cleaned';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async maintenance(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await tableService.enterMaintenance({
        tableId: String(req.body?.tableId || req.params.id || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        status: 'MAINTENANCE',
        changedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to enter maintenance';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async restoreMaintenance(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await tableService.exitMaintenance({
        tableId: String(req.body?.tableId || req.params.id || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        changedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to restore maintenance';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }
}