import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { TableGroupService } from '../application/services/table-group.service';
import { LoggingDiningEventPublisher } from './dining-event.publisher';
import { PrismaTableGroupRepository } from '../infrastructure/repositories/prisma-table-group.repository';

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
  if (/permission denied/i.test(message)) {
    return 403;
  }
  if (/conflict/i.test(message) || /already/i.test(message)) {
    return 409;
  }
  return 400;
}

export class TableGroupController {
  constructor(private readonly service: TableGroupService = new TableGroupService(
    new PrismaTableGroupRepository(),
    new LoggingDiningEventPublisher(),
  )) {}

  async requestMerge(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await this.service.requestMerge({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        tableIds: Array.isArray(req.body?.tables) ? req.body.tables : [],
        reason: String(req.body?.reason || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        requestedBy: context.actorId,
        actorRole: context.actorRole,
      });
      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      return sendError(res, parseErrorStatus(error?.message || 'Failed to request merge'), error?.message || 'Failed to request merge', { code: 'VALIDATION_ERROR', req });
    }
  }

  async approveMerge(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await this.service.approveMerge({
        mergeId: String(req.body?.mergeId || req.params.mergeId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        approvedBy: context.actorId,
        actorRole: context.actorRole,
      });
      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      return sendError(res, parseErrorStatus(error?.message || 'Failed to approve merge'), error?.message || 'Failed to approve merge', { code: 'VALIDATION_ERROR', req });
    }
  }

  async releaseGroup(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await this.service.releaseGroup({
        groupId: String(req.body?.groupId || req.params.groupId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        releasedBy: context.actorId,
        actorRole: context.actorRole,
      });
      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      return sendError(res, parseErrorStatus(error?.message || 'Failed to release merge'), error?.message || 'Failed to release merge', { code: 'VALIDATION_ERROR', req });
    }
  }
}
