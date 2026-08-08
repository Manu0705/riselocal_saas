import type { Request } from 'express';
import type {
  AddAddonRequestDTO,
  AddModifierRequestDTO,
  AddVariantRequestDTO,
  CreateCategoryRequestDTO,
  CreateItemRequestDTO,
  CreateMenuRequestDTO,
  DeleteVariantRequestDTO,
  ItemAvailabilityRequestDTO,
  RequestContextDTO,
  UpdateCategoryRequestDTO,
  UpdateItemRequestDTO,
  UpdateMenuRequestDTO,
} from './dining.dto';

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNullableString(value: unknown): string | null {
  const parsed = asString(value);
  return parsed.length > 0 ? parsed : null;
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asNullableNumber(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function mapRequestContext(req: Request): RequestContextDTO {
  return {
    tenantId: asString(req.params.tenantId || req.tenant?.id || req.user?.tenantId),
    locationId: asString(req.body?.locationId || req.query.locationId || req.headers['x-location-id']),
    actorId: asNullableString(req.user?.id),
  };
}

export function mapCreateMenuRequest(req: Request): CreateMenuRequestDTO {
  return {
    name: asString(req.body?.name),
    description: asNullableString(req.body?.description),
    sortOrder: asOptionalNumber(req.body?.sortOrder),
  };
}

export function mapUpdateMenuRequest(req: Request): UpdateMenuRequestDTO {
  return {
    name: req.body?.name === undefined ? undefined : asString(req.body?.name),
    description: req.body?.description === undefined ? undefined : asNullableString(req.body?.description),
    sortOrder: asOptionalNumber(req.body?.sortOrder),
  };
}

export function mapCreateCategoryRequest(req: Request): CreateCategoryRequestDTO {
  return {
    menuId: asString(req.body?.menuId),
    name: asString(req.body?.name),
    description: asNullableString(req.body?.description),
    image: asNullableString(req.body?.image),
    sortOrder: asOptionalNumber(req.body?.sortOrder),
  };
}

export function mapUpdateCategoryRequest(req: Request): UpdateCategoryRequestDTO {
  return {
    menuId: asString(req.body?.menuId),
    name: req.body?.name === undefined ? undefined : asString(req.body?.name),
    description: req.body?.description === undefined ? undefined : asNullableString(req.body?.description),
    image: req.body?.image === undefined ? undefined : asNullableString(req.body?.image),
    sortOrder: asOptionalNumber(req.body?.sortOrder),
  };
}

export function mapCreateItemRequest(req: Request): CreateItemRequestDTO {
  return {
    menuId: asString(req.body?.menuId),
    categoryId: asString(req.body?.categoryId),
    name: asString(req.body?.name),
    description: asNullableString(req.body?.description),
    shortDescription: asNullableString(req.body?.shortDescription),
    image: asNullableString(req.body?.image),
    basePrice: asNullableNumber(req.body?.basePrice),
    itemType: req.body?.itemType,
  };
}

export function mapUpdateItemRequest(req: Request): UpdateItemRequestDTO {
  return {
    menuId: asString(req.body?.menuId),
    name: req.body?.name === undefined ? undefined : asString(req.body?.name),
    description: req.body?.description === undefined ? undefined : asNullableString(req.body?.description),
    shortDescription:
      req.body?.shortDescription === undefined ? undefined : asNullableString(req.body?.shortDescription),
    image: req.body?.image === undefined ? undefined : asNullableString(req.body?.image),
    basePrice: asNullableNumber(req.body?.basePrice),
    kitchenStationId:
      req.body?.kitchenStationId === undefined ? undefined : asNullableString(req.body?.kitchenStationId),
  };
}

export function mapAvailabilityRequest(req: Request): ItemAvailabilityRequestDTO {
  return {
    menuId: asString(req.body?.menuId),
    status: req.body?.status,
    reason: asNullableString(req.body?.reason),
  };
}

export function mapAddVariantRequest(req: Request): AddVariantRequestDTO {
  return {
    menuId: asString(req.body?.menuId),
    name: asString(req.body?.name),
    priceAdjustment: asNullableNumber(req.body?.priceAdjustment),
    sku: asNullableString(req.body?.sku),
  };
}

export function mapAddAddonRequest(req: Request): AddAddonRequestDTO {
  return {
    menuId: asString(req.body?.menuId),
    name: asString(req.body?.name),
    price: asNullableNumber(req.body?.price),
    maxQuantity: asNullableNumber(req.body?.maxQuantity),
  };
}

export function mapAddModifierRequest(req: Request): AddModifierRequestDTO {
  return {
    menuId: asString(req.body?.menuId),
    name: asString(req.body?.name),
    type: req.body?.type,
  };
}

export function mapDeleteVariantRequest(req: Request): DeleteVariantRequestDTO {
  return {
    menuId: asString(req.body?.menuId || req.query.menuId),
    itemId: asString(req.body?.itemId || req.query.itemId),
  };
}
