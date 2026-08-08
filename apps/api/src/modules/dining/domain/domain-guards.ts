import {
  ALLOWED_AVAILABILITY_TRANSITIONS,
  isArchivedStatus,
  isValidPrice,
} from '@saas/domain-core/dining/menu.validation';
import type {
  AvailabilityStatus,
  KitchenStationStatus,
  MenuItemType,
  MenuStatus,
  ModifierType,
} from '@saas/domain-core/dining/menu.contract';

const MENU_STATUSES: readonly MenuStatus[] = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
const ITEM_TYPES: readonly MenuItemType[] = ['STANDARD', 'VARIABLE', 'COMBO', 'SERVICE'];
const AVAILABILITY_STATUSES: readonly AvailabilityStatus[] = [
  'AVAILABLE',
  'OUT_OF_STOCK',
  'TEMPORARILY_UNAVAILABLE',
  'DISABLED',
];
const MODIFIER_TYPES: readonly ModifierType[] = ['TEXT', 'OPTION', 'BOOLEAN'];
const STATION_STATUSES: readonly KitchenStationStatus[] = ['ACTIVE', 'INACTIVE'];

export function assertRequired(value: string, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
}

export function assertNonNegative(value: number, fieldName: string): void {
  if (!isValidPrice(value)) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
}

export function assertMutable(status: MenuStatus, entityName: string): void {
  if (isArchivedStatus(status)) {
    throw new Error(`${entityName} is archived and cannot be modified`);
  }
}

export function normalizeMenuStatus(value?: string | null): MenuStatus {
  const status = (value ?? 'ACTIVE').toUpperCase() as MenuStatus;
  if (!MENU_STATUSES.includes(status)) {
    throw new Error(`Invalid menu status: ${String(value)}`);
  }
  return status;
}

export function normalizeItemType(value?: string | null): MenuItemType {
  const itemType = (value ?? 'STANDARD').toUpperCase() as MenuItemType;
  if (!ITEM_TYPES.includes(itemType)) {
    throw new Error(`Invalid item type: ${String(value)}`);
  }
  return itemType;
}

export function normalizeAvailabilityStatus(value?: string | null): AvailabilityStatus {
  const status = (value ?? 'AVAILABLE').toUpperCase() as AvailabilityStatus;
  if (!AVAILABILITY_STATUSES.includes(status)) {
    throw new Error(`Invalid availability status: ${String(value)}`);
  }
  return status;
}

export function normalizeModifierType(value?: string | null): ModifierType {
  const modifierType = (value ?? 'TEXT').toUpperCase() as ModifierType;
  if (!MODIFIER_TYPES.includes(modifierType)) {
    throw new Error(`Invalid modifier type: ${String(value)}`);
  }
  return modifierType;
}

export function normalizeStationStatus(value?: string | null): KitchenStationStatus {
  const status = (value ?? 'ACTIVE').toUpperCase() as KitchenStationStatus;
  if (!STATION_STATUSES.includes(status)) {
    throw new Error(`Invalid kitchen station status: ${String(value)}`);
  }
  return status;
}

export function assertAvailabilityTransition(current: AvailabilityStatus, next: AvailabilityStatus): void {
  if (current === next) {
    return;
  }

  const allowed = ALLOWED_AVAILABILITY_TRANSITIONS[current] as readonly string[] | undefined;
  if (!allowed || !allowed.includes(next)) {
    throw new Error(`Invalid availability transition from ${current} to ${next}`);
  }
}
