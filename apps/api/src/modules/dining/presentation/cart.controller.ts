import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import { CartService } from '../application/services/cart.service';
import { PrismaCartRepository } from '../infrastructure/repositories/prisma-cart.repository';
import { PrismaSessionStateGateway } from '../infrastructure/repositories/prisma-session-state.gateway';
import { LoggingDiningEventPublisher } from './dining-event.publisher';
import { mapEntityResponse } from './cart.dto';
import { requireTenantAndLocation } from './dining.validation';
import { requireCartItemId, requireCartMenuItemId, requireCartQuantity, requireCartSessionId } from './cart.validation';
import { PrismaMenuRepository } from '../infrastructure/repositories/prisma-menu.repository';

const repository = new PrismaCartRepository();
const menuRepository = new PrismaMenuRepository();
const stateGateway = new PrismaSessionStateGateway();
const eventPublisher = new LoggingDiningEventPublisher();
const cartService = new CartService(repository, menuRepository, stateGateway, eventPublisher);

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

export class CartController {
  async getActive(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await cartService.getActiveCart({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
      });

      return sendSuccess(res, 200, result, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to fetch cart';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async addItem(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await cartService.addItem({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        menuItemId: String(req.body?.menuItemId || '').trim(),
        variantId: req.body?.variantId ? String(req.body.variantId).trim() : undefined,
        quantity: Number(req.body?.quantity),
        notes: req.body?.notes ? String(req.body.notes) : null,
        modifiers: Array.isArray(req.body?.modifiers) ? req.body.modifiers : undefined,
        addedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to add cart item';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async updateItem(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await cartService.updateItem({
        itemId: String(req.body?.itemId || req.params.itemId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        quantity: Number(req.body?.quantity),
        notes: req.body?.notes ? String(req.body.notes) : null,
        modifiers: Array.isArray(req.body?.modifiers) ? req.body.modifiers : undefined,
        updatedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to update cart item';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async removeItem(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await cartService.removeItem({
        itemId: String(req.body?.itemId || req.params.itemId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        removedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, mapEntityResponse(result as unknown as Record<string, unknown>), req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to remove cart item';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const context = parseContext(req);
      const result = await cartService.submitCart({
        sessionId: String(req.body?.sessionId || req.params.sessionId || '').trim(),
        tenantId: context.tenantId,
        locationId: context.locationId,
        submittedBy: context.actorId,
        actorRole: context.actorRole,
      });

      return sendSuccess(res, 200, result as unknown as Record<string, unknown>, req);
    } catch (error: any) {
      const message = error?.message ?? 'Failed to submit cart';
      return sendError(res, parseErrorStatus(message), message, { code: 'VALIDATION_ERROR', req });
    }
  }
}