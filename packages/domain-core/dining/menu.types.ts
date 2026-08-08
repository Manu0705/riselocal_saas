import type { AvailabilityStatus, KitchenStationStatus, MenuItemType, MenuStatus, ModifierType } from './menu.contract';

export interface Menu {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  description?: string | null;
  status?: MenuStatus;
  sortOrder?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface MenuCategory {
  id: string;
  menuId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sortOrder?: number;
  status?: MenuStatus;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: string | null;
  basePrice?: number;
  itemType?: MenuItemType;
  kitchenStationId?: string | null;
  status?: MenuStatus;
  availability?: AvailabilityStatus;
}

export interface ItemVariant {
  id: string;
  itemId: string;
  name: string;
  priceAdjustment?: number;
  sku?: string | null;
  status?: MenuStatus;
}

export interface ItemAddon {
  id: string;
  itemId: string;
  name: string;
  price?: number;
  maxQuantity?: number;
  status?: MenuStatus;
}

export interface ItemModifier {
  id: string;
  itemId: string;
  name: string;
  type?: ModifierType;
  status?: MenuStatus;
}

export interface ItemPrice {
  id: string;
  itemId: string;
  variantId?: string | null;
  amount?: number;
  currency?: string;
  effectiveFrom?: string | Date | null;
  effectiveTo?: string | Date | null;
}

export interface ItemAvailability {
  id: string;
  itemId: string;
  status?: AvailabilityStatus;
  reason?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | Date;
}

export interface KitchenStation {
  id: string;
  locationId: string;
  name: string;
  status?: KitchenStationStatus;
}

export interface MenuItemImage {
  id: string;
  itemId: string;
  url: string;
  sortOrder?: number;
  status?: MenuStatus;
}
