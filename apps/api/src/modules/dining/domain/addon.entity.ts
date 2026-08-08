import crypto from 'node:crypto';
import type { MenuStatus } from '@saas/domain-core/dining/menu.contract';
import {
  assertMutable,
  assertNonNegative,
  assertRequired,
  normalizeMenuStatus,
} from './domain-guards';

export interface AddonProps {
  id: string;
  tenantId: string;
  locationId: string;
  itemId: string;
  name: string;
  price: number | null;
  maxQuantity: number | null;
  status: MenuStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
  deletedAt: Date | null;
}

export interface CreateAddonProps {
  tenantId: string;
  locationId: string;
  itemId: string;
  name: string;
  price?: number | null;
  maxQuantity?: number | null;
  createdBy?: string | null;
}

export class AddonEntity {
  private readonly props: AddonProps;

  private constructor(props: AddonProps) {
    this.props = props;
  }

  static create(props: CreateAddonProps): AddonEntity {
    assertRequired(props.tenantId, 'tenantId');
    assertRequired(props.locationId, 'locationId');
    assertRequired(props.itemId, 'itemId');
    assertRequired(props.name, 'addon name');

    if (props.price !== undefined && props.price !== null) {
      assertNonNegative(props.price, 'addon price');
    }

    const now = new Date();

    return new AddonEntity({
      id: crypto.randomUUID(),
      tenantId: props.tenantId,
      locationId: props.locationId,
      itemId: props.itemId,
      name: props.name.trim(),
      price: props.price ?? null,
      maxQuantity: props.maxQuantity ?? null,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy ?? null,
      updatedBy: props.createdBy ?? null,
      version: 0,
      deletedAt: null,
    });
  }

  static fromPersistence(props: AddonProps): AddonEntity {
    return new AddonEntity({
      ...props,
      status: normalizeMenuStatus(props.status),
    });
  }

  rename(name: string, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Addon');
    assertRequired(name, 'addon name');
    this.props.name = name.trim();
    this.touch(updatedBy);
  }

  setPrice(price: number | null, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Addon');
    if (price !== null) {
      assertNonNegative(price, 'addon price');
    }
    this.props.price = price;
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

  get itemId(): string {
    return this.props.itemId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get locationId(): string {
    return this.props.locationId;
  }

  toJSON(): AddonProps {
    return { ...this.props };
  }
}
