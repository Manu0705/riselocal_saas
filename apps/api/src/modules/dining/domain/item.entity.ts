import crypto from 'node:crypto';
import type { AvailabilityStatus, MenuItemType, MenuStatus } from '@saas/domain-core/dining/menu.contract';
import {
  assertMutable,
  assertNonNegative,
  assertRequired,
  normalizeAvailabilityStatus,
  normalizeItemType,
  normalizeMenuStatus,
} from './domain-guards';

export interface ItemProps {
  id: string;
  tenantId: string;
  locationId: string;
  categoryId: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  image: string | null;
  basePrice: number | null;
  itemType: MenuItemType;
  kitchenStationId: string | null;
  status: MenuStatus;
  availability: AvailabilityStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
  deletedAt: Date | null;
}

export interface CreateItemProps {
  tenantId: string;
  locationId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: string | null;
  basePrice?: number | null;
  itemType?: MenuItemType;
  kitchenStationId?: string | null;
  createdBy?: string | null;
}

export class ItemEntity {
  private readonly props: ItemProps;

  private constructor(props: ItemProps) {
    this.props = props;
  }

  static create(props: CreateItemProps): ItemEntity {
    assertRequired(props.tenantId, 'tenantId');
    assertRequired(props.locationId, 'locationId');
    assertRequired(props.categoryId, 'categoryId');
    assertRequired(props.name, 'item name');

    if (props.basePrice !== undefined && props.basePrice !== null) {
      assertNonNegative(props.basePrice, 'basePrice');
    }

    const now = new Date();

    return new ItemEntity({
      id: crypto.randomUUID(),
      tenantId: props.tenantId,
      locationId: props.locationId,
      categoryId: props.categoryId,
      name: props.name.trim(),
      description: props.description ?? null,
      shortDescription: props.shortDescription ?? null,
      image: props.image ?? null,
      basePrice: props.basePrice ?? null,
      itemType: props.itemType ?? 'STANDARD',
      kitchenStationId: props.kitchenStationId ?? null,
      status: 'ACTIVE',
      availability: 'AVAILABLE',
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy ?? null,
      updatedBy: props.createdBy ?? null,
      version: 0,
      deletedAt: null,
    });
  }

  static fromPersistence(props: ItemProps): ItemEntity {
    return new ItemEntity({
      ...props,
      status: normalizeMenuStatus(props.status),
      itemType: normalizeItemType(props.itemType),
      availability: normalizeAvailabilityStatus(props.availability),
    });
  }

  rename(name: string, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Item');
    assertRequired(name, 'item name');
    this.props.name = name.trim();
    this.touch(updatedBy);
  }

  setBasePrice(basePrice: number | null, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Item');
    if (basePrice !== null) {
      assertNonNegative(basePrice, 'basePrice');
    }
    this.props.basePrice = basePrice;
    this.touch(updatedBy);
  }

  assignKitchenStation(kitchenStationId: string | null, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Item');
    this.props.kitchenStationId = kitchenStationId;
    this.touch(updatedBy);
  }

  setAvailability(status: AvailabilityStatus, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Item');
    this.props.availability = normalizeAvailabilityStatus(status);
    this.touch(updatedBy);
  }

  archive(updatedBy?: string | null): void {
    this.props.status = 'ARCHIVED';
    this.touch(updatedBy);
    this.props.deletedAt = new Date();
  }

  private touch(updatedBy?: string | null): void {
    this.props.updatedBy = updatedBy ?? this.props.updatedBy;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  get id(): string {
    return this.props.id;
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get locationId(): string {
    return this.props.locationId;
  }

  get status(): MenuStatus {
    return this.props.status;
  }

  toJSON(): ItemProps {
    return { ...this.props };
  }
}
