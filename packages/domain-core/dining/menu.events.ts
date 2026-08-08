import type { AvailabilityStatus } from './menu.contract';

export interface MenuCreated {
  menuId: string;
  locationId: string;
  tenantId: string;
}

export interface MenuUpdated {
  menuId: string;
  locationId: string;
  tenantId: string;
}

export interface ItemAvailabilityChanged {
  itemId: string;
  tenantId: string;
  locationId: string;
  oldStatus?: AvailabilityStatus;
  newStatus?: AvailabilityStatus;
  changedBy?: string | null;
}

export interface PriceChanged {
  itemId: string;
  tenantId: string;
  locationId: string;
  oldAmount?: number;
  newAmount?: number;
  changedBy?: string | null;
}

export interface ItemArchived {
  itemId: string;
  tenantId: string;
  locationId: string;
  archivedBy?: string | null;
}

export interface KitchenStationAssigned {
  itemId: string;
  tenantId: string;
  locationId: string;
  kitchenStationId?: string | null;
  assignedBy?: string | null;
}
