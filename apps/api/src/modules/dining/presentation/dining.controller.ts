import type { Request, Response } from 'express';
import { AddonEntity } from '../domain/addon.entity';
import { CategoryEntity } from '../domain/category.entity';
import { ItemEntity } from '../domain/item.entity';
import { VariantEntity } from '../domain/variant.entity';
import { AvailabilityService } from '../application/services/availability.service';
import { CategoryService } from '../application/services/category.service';
import { KitchenRoutingService } from '../application/services/kitchen-routing.service';
import { MenuItemService } from '../application/services/menu-item.service';
import { MenuService } from '../application/services/menu.service';
import { PricingService } from '../application/services/pricing.service';
import { PublicMenuQueryService } from '../application/services/public-menu-query.service';
import { cloneSnapshot, rebuild } from '../application/services/service-helpers';
import { PrismaKitchenStationRepository } from '../infrastructure/repositories/prisma-kitchen-station.repository';
import { PrismaMenuRepository } from '../infrastructure/repositories/prisma-menu.repository';
import { sendError, sendSuccess } from '../../../shared/http/api-response';
import {
  mapAddAddonRequest,
  mapAddModifierRequest,
  mapAddVariantRequest,
  mapAvailabilityRequest,
  mapCreateCategoryRequest,
  mapCreateItemRequest,
  mapCreateMenuRequest,
  mapDeleteVariantRequest,
  mapRequestContext,
  mapUpdateCategoryRequest,
  mapUpdateItemRequest,
  mapUpdateMenuRequest,
} from './dining.mapper';
import { LoggingDiningEventPublisher } from './dining-event.publisher';

const menuRepository = new PrismaMenuRepository();
const kitchenStationRepository = new PrismaKitchenStationRepository();
const eventPublisher = new LoggingDiningEventPublisher();

const menuService = new MenuService(menuRepository, eventPublisher);
const categoryService = new CategoryService(menuRepository, eventPublisher);
const menuItemService = new MenuItemService(menuRepository, eventPublisher);
const pricingService = new PricingService(menuRepository, eventPublisher);
const availabilityService = new AvailabilityService(menuRepository, eventPublisher);
const publicMenuQueryService = new PublicMenuQueryService(menuRepository);
const kitchenRoutingService = new KitchenRoutingService(
  menuRepository,
  kitchenStationRepository,
  eventPublisher,
);

function getEntityFromArrayById<T extends { id: string; deletedAt: Date | null }>(
  values: T[],
  id: string,
): { index: number; item: T } {
  const index = values.findIndex((entry) => entry.id === id && entry.deletedAt === null);
  if (index < 0) {
    throw new Error('Entity not found');
  }

  return { index, item: values[index] };
}

function applySoftArchiveVersioning(snapshot: ReturnType<ReturnType<typeof rebuild>['toJSON']>, actorId: string | null) {
  snapshot.menu.updatedAt = new Date();
  snapshot.menu.updatedBy = actorId ?? snapshot.menu.updatedBy;
  snapshot.menu.version += 1;
}

export class DiningController {
  async createMenu(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapCreateMenuRequest(req);

      const created = await menuService.createMenu({
        tenantId: context.tenantId,
        locationId: context.locationId,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder,
        createdBy: context.actorId,
      });

      return sendSuccess(res, 201, created, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to create menu', { code: 'VALIDATION_ERROR', req });
    }
  }

  async updateMenu(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapUpdateMenuRequest(req);

      const updated = await menuService.updateMenu({
        menuId: String(req.params.id || ''),
        tenantId: context.tenantId,
        locationId: context.locationId,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder,
        updatedBy: context.actorId,
      });

      return sendSuccess(res, 200, updated, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to update menu', { code: 'VALIDATION_ERROR', req });
    }
  }

  async getPublicMenus(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const data = await publicMenuQueryService.getActiveMenus({
        tenantId: context.tenantId,
        locationId: context.locationId,
        menuId: typeof req.query.menuId === 'string' ? req.query.menuId : undefined,
      });

      return sendSuccess(res, 200, data, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to load public menus', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapCreateCategoryRequest(req);

      const created = await categoryService.createCategory({
        tenantId: context.tenantId,
        locationId: context.locationId,
        menuId: dto.menuId,
        name: dto.name,
        description: dto.description,
        image: dto.image,
        sortOrder: dto.sortOrder,
        createdBy: context.actorId,
      });

      return sendSuccess(res, 201, created, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to create category', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapUpdateCategoryRequest(req);
      const categoryId = String(req.params.id || '');

      const menu = await menuRepository.findById(dto.menuId, context.tenantId, context.locationId);
      if (!menu) {
        return sendError(res, 404, 'Menu not found', { code: 'NOT_FOUND', req });
      }

      const snapshot = cloneSnapshot(menu.toJSON());
      const { index } = getEntityFromArrayById(snapshot.categories, categoryId);
      const current = snapshot.categories[index];

      if (current.status === 'ARCHIVED') {
        return sendError(res, 400, 'Category is archived and cannot be modified', {
          code: 'VALIDATION_ERROR',
          req,
        });
      }

      const category = CategoryEntity.fromPersistence(current);

      if (dto.name !== undefined) {
        category.rename(dto.name, context.actorId);
      }

      if (dto.sortOrder !== undefined) {
        category.reorder(dto.sortOrder, context.actorId);
      }

      const mapped = category.toJSON();
      if (dto.description !== undefined) {
        mapped.description = dto.description;
      }
      if (dto.image !== undefined) {
        mapped.image = dto.image;
      }
      if (dto.description !== undefined || dto.image !== undefined) {
        mapped.updatedAt = new Date();
        mapped.updatedBy = context.actorId ?? mapped.updatedBy;
        mapped.version += 1;
      }

      snapshot.categories[index] = mapped;
      applySoftArchiveVersioning(snapshot, context.actorId);

      const updatedMenu = rebuild(snapshot);
      await menuRepository.update(updatedMenu);
      await eventPublisher.publish({
        type: 'MenuUpdated',
        payload: {
          menuId: updatedMenu.id,
          tenantId: updatedMenu.tenantId,
          locationId: updatedMenu.locationId,
        },
      });

      return sendSuccess(res, 200, mapped, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to update category', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const menuId = String(req.body.menuId || req.query.menuId || '');

      await categoryService.archiveCategory({
        menuId,
        categoryId: String(req.params.id || ''),
        tenantId: context.tenantId,
        locationId: context.locationId,
        archivedBy: context.actorId,
      });

      return sendSuccess(res, 200, { message: 'Category archived' }, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to archive category', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async createItem(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapCreateItemRequest(req);

      const created = await menuItemService.createItem({
        menuId: dto.menuId,
        categoryId: dto.categoryId,
        tenantId: context.tenantId,
        locationId: context.locationId,
        name: dto.name,
        description: dto.description,
        shortDescription: dto.shortDescription,
        image: dto.image,
        basePrice: dto.basePrice,
        itemType: dto.itemType,
        createdBy: context.actorId,
      });

      return sendSuccess(res, 201, created, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to create item', { code: 'VALIDATION_ERROR', req });
    }
  }

  async updateItem(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapUpdateItemRequest(req);
      const itemId = String(req.params.id || '');

      const menu = await menuRepository.findById(dto.menuId, context.tenantId, context.locationId);
      if (!menu) {
        return sendError(res, 404, 'Menu not found', { code: 'NOT_FOUND', req });
      }

      const snapshot = cloneSnapshot(menu.toJSON());
      const { index } = getEntityFromArrayById(snapshot.items, itemId);
      const current = snapshot.items[index];

      if (current.status === 'ARCHIVED') {
        return sendError(res, 400, 'Item is archived and cannot be modified', {
          code: 'VALIDATION_ERROR',
          req,
        });
      }

      const item = ItemEntity.fromPersistence(current);

      if (dto.name !== undefined) {
        item.rename(dto.name, context.actorId);
      }

      if (dto.basePrice !== undefined) {
        item.setBasePrice(dto.basePrice, context.actorId);
      }

      if (dto.kitchenStationId !== undefined) {
        if (dto.kitchenStationId) {
          const station = await kitchenStationRepository.findById(
            dto.kitchenStationId,
            context.tenantId,
            context.locationId,
          );

          if (!station || station.toJSON().status !== 'ACTIVE') {
            return sendError(res, 400, 'Kitchen station must exist and be active', {
              code: 'VALIDATION_ERROR',
              req,
            });
          }
        }

        item.assignKitchenStation(dto.kitchenStationId ?? null, context.actorId);
      }

      const mapped = item.toJSON();
      let itemTouched = dto.name !== undefined || dto.basePrice !== undefined || dto.kitchenStationId !== undefined;

      if (dto.description !== undefined) {
        mapped.description = dto.description;
        itemTouched = true;
      }
      if (dto.shortDescription !== undefined) {
        mapped.shortDescription = dto.shortDescription;
        itemTouched = true;
      }
      if (dto.image !== undefined) {
        mapped.image = dto.image;
        itemTouched = true;
      }

      if (itemTouched) {
        mapped.updatedAt = new Date();
        mapped.updatedBy = context.actorId ?? mapped.updatedBy;
        mapped.version += 1;
      }

      snapshot.items[index] = mapped;
      applySoftArchiveVersioning(snapshot, context.actorId);

      const updatedMenu = rebuild(snapshot);
      await menuRepository.update(updatedMenu);

      if (dto.kitchenStationId !== undefined) {
        await eventPublisher.publish({
          type: 'KitchenStationAssigned',
          payload: {
            itemId,
            tenantId: context.tenantId,
            locationId: context.locationId,
            kitchenStationId: dto.kitchenStationId,
            assignedBy: context.actorId,
          },
        });
      }

      await eventPublisher.publish({
        type: 'MenuUpdated',
        payload: {
          menuId: updatedMenu.id,
          tenantId: updatedMenu.tenantId,
          locationId: updatedMenu.locationId,
        },
      });

      return sendSuccess(res, 200, mapped, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to update item', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async updateItemAvailability(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapAvailabilityRequest(req);

      await availabilityService.setAvailability({
        menuId: dto.menuId,
        itemId: String(req.params.id || ''),
        tenantId: context.tenantId,
        locationId: context.locationId,
        status: dto.status,
        reason: dto.reason,
        changedBy: context.actorId,
      });

      return sendSuccess(res, 200, { message: 'Availability updated' }, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to update availability', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async createItemVariant(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapAddVariantRequest(req);
      const itemId = String(req.params.id || '');

      const created = await menuItemService.addVariant({
        menuId: dto.menuId,
        itemId,
        tenantId: context.tenantId,
        locationId: context.locationId,
        name: dto.name,
        priceAdjustment: dto.priceAdjustment,
        sku: dto.sku,
        createdBy: context.actorId,
      });

      return sendSuccess(res, 201, created, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to create variant', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async deleteVariant(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapDeleteVariantRequest(req);
      const variantId = String(req.params.id || '');

      const menu = await menuRepository.findById(dto.menuId, context.tenantId, context.locationId);
      if (!menu) {
        return sendError(res, 404, 'Menu not found', { code: 'NOT_FOUND', req });
      }

      const snapshot = cloneSnapshot(menu.toJSON());
      const variantIndex = snapshot.variants.findIndex(
        (entry) => entry.id === variantId && entry.itemId === dto.itemId && entry.deletedAt === null,
      );

      if (variantIndex < 0) {
        return sendError(res, 404, 'Variant not found', { code: 'NOT_FOUND', req });
      }

      const variant = VariantEntity.fromPersistence(snapshot.variants[variantIndex]);
      variant.archive(context.actorId);
      snapshot.variants[variantIndex] = variant.toJSON();

      const now = new Date();
      for (let idx = 0; idx < snapshot.prices.length; idx += 1) {
        const price = snapshot.prices[idx];
        if (price.variantId === variantId && price.deletedAt === null) {
          snapshot.prices[idx] = {
            ...price,
            deletedAt: now,
            updatedBy: context.actorId ?? price.updatedBy,
            updatedAt: now,
            version: price.version + 1,
          };
        }
      }

      applySoftArchiveVersioning(snapshot, context.actorId);
      const updatedMenu = rebuild(snapshot);
      await menuRepository.update(updatedMenu);

      await eventPublisher.publish({
        type: 'MenuUpdated',
        payload: {
          menuId: updatedMenu.id,
          tenantId: updatedMenu.tenantId,
          locationId: updatedMenu.locationId,
        },
      });

      return sendSuccess(res, 200, { message: 'Variant archived' }, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to archive variant', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async createItemAddon(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapAddAddonRequest(req);
      const itemId = String(req.params.id || '');

      const menu = await menuRepository.findById(dto.menuId, context.tenantId, context.locationId);
      if (!menu) {
        return sendError(res, 404, 'Menu not found', { code: 'NOT_FOUND', req });
      }

      const snapshot = cloneSnapshot(menu.toJSON());
      const { item } = getEntityFromArrayById(snapshot.items, itemId);

      if (item.status === 'ARCHIVED') {
        return sendError(res, 400, 'Cannot add addons to archived item', {
          code: 'VALIDATION_ERROR',
          req,
        });
      }

      const duplicate = snapshot.addons.some(
        (addon) => addon.itemId === itemId && addon.deletedAt === null && addon.name.toLowerCase() === dto.name.toLowerCase(),
      );

      if (duplicate) {
        return sendError(res, 400, 'Addon name must be unique per item', {
          code: 'VALIDATION_ERROR',
          req,
        });
      }

      const addon = AddonEntity.create({
        tenantId: context.tenantId,
        locationId: context.locationId,
        itemId,
        name: dto.name,
        price: dto.price,
        maxQuantity: dto.maxQuantity ?? undefined,
        createdBy: context.actorId,
      });

      snapshot.addons.push(addon.toJSON());
      applySoftArchiveVersioning(snapshot, context.actorId);

      const updatedMenu = rebuild(snapshot);
      await menuRepository.update(updatedMenu);
      await eventPublisher.publish({
        type: 'MenuUpdated',
        payload: {
          menuId: updatedMenu.id,
          tenantId: updatedMenu.tenantId,
          locationId: updatedMenu.locationId,
        },
      });

      return sendSuccess(res, 201, addon.toJSON(), req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to create addon', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async createItemModifier(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const dto = mapAddModifierRequest(req);

      const created = await menuItemService.addModifier({
        menuId: dto.menuId,
        itemId: String(req.params.id || ''),
        tenantId: context.tenantId,
        locationId: context.locationId,
        name: dto.name,
        type: dto.type,
        createdBy: context.actorId,
      });

      return sendSuccess(res, 201, created, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to create modifier', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async updateItemPricing(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const menuId = String(req.body?.menuId || req.query.menuId || '');

      await pricingService.upsertPrice({
        menuId,
        tenantId: context.tenantId,
        locationId: context.locationId,
        itemId: String(req.params.id || ''),
        variantId:
          typeof req.body?.variantId === 'string' && req.body.variantId.trim().length > 0
            ? req.body.variantId
            : null,
        priceId: typeof req.body?.priceId === 'string' ? req.body.priceId : undefined,
        amount: req.body?.amount ?? null,
        currency: typeof req.body?.currency === 'string' ? req.body.currency : undefined,
        effectiveFrom: req.body?.effectiveFrom ? new Date(req.body.effectiveFrom) : null,
        effectiveTo: req.body?.effectiveTo ? new Date(req.body.effectiveTo) : null,
        changedBy: context.actorId,
      });

      return sendSuccess(res, 200, { message: 'Pricing updated' }, req);
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to update pricing', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }

  async listKitchenStations(req: Request, res: Response) {
    try {
      const context = mapRequestContext(req);
      const stations = await kitchenRoutingService.listKitchenStations({
        tenantId: context.tenantId,
        locationId: context.locationId,
      });

      return sendSuccess(
        res,
        200,
        stations.map((station) => station.toJSON()),
        req,
      );
    } catch (error: any) {
      return sendError(res, 400, error?.message ?? 'Failed to list kitchen stations', {
        code: 'VALIDATION_ERROR',
        req,
      });
    }
  }
}
