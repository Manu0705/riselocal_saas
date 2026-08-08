import type {
  AvailabilityStatus,
  MenuItemType,
  ModifierType,
} from '@saas/domain-core/dining/menu.contract';

export interface RequestContextDTO {
  tenantId: string;
  locationId: string;
  actorId: string | null;
}

export interface CreateMenuRequestDTO {
  name: string;
  description?: string | null;
  sortOrder?: number;
}

export interface UpdateMenuRequestDTO {
  name?: string;
  description?: string | null;
  sortOrder?: number;
}

export interface CreateCategoryRequestDTO {
  menuId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sortOrder?: number;
}

export interface UpdateCategoryRequestDTO {
  menuId: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  sortOrder?: number;
}

export interface CreateItemRequestDTO {
  menuId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: string | null;
  basePrice?: number | null;
  itemType?: MenuItemType;
}

export interface UpdateItemRequestDTO {
  menuId: string;
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: string | null;
  basePrice?: number | null;
  kitchenStationId?: string | null;
}

export interface ItemAvailabilityRequestDTO {
  menuId: string;
  status: AvailabilityStatus;
  reason?: string | null;
}

export interface AddVariantRequestDTO {
  menuId: string;
  name: string;
  priceAdjustment?: number | null;
  sku?: string | null;
}

export interface AddAddonRequestDTO {
  menuId: string;
  name: string;
  price?: number | null;
  maxQuantity?: number | null;
}

export interface AddModifierRequestDTO {
  menuId: string;
  name: string;
  type?: ModifierType;
}

export interface DeleteVariantRequestDTO {
  menuId: string;
  itemId: string;
}

export function mapEntityResponse<T extends Record<string, unknown>>(value: T): T {
  return value;
}
