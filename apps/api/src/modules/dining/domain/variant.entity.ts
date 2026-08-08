import crypto from 'node:crypto';
import type { MenuStatus } from '@saas/domain-core/dining/menu.contract';
import { assertMutable, assertRequired, normalizeMenuStatus } from './domain-guards';

export interface VariantProps {
  id: string;
  tenantId: string;
  locationId: string;
  itemId: string;
  name: string;
  priceAdjustment: number | null;
  sku: string | null;
  status: MenuStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
  deletedAt: Date | null;
}

export interface CreateVariantProps {
  tenantId: string;
  locationId: string;
  itemId: string;
  name: string;
  priceAdjustment?: number | null;
  sku?: string | null;
  createdBy?: string | null;
}

export class VariantEntity {
  private readonly props: VariantProps;

  private constructor(props: VariantProps) {
    this.props = props;
  }

  static create(props: CreateVariantProps): VariantEntity {
    assertRequired(props.tenantId, 'tenantId');
    assertRequired(props.locationId, 'locationId');
    assertRequired(props.itemId, 'itemId');
    assertRequired(props.name, 'variant name');

    const now = new Date();

    return new VariantEntity({
      id: crypto.randomUUID(),
      tenantId: props.tenantId,
      locationId: props.locationId,
      itemId: props.itemId,
      name: props.name.trim(),
      priceAdjustment: props.priceAdjustment ?? null,
      sku: props.sku ?? null,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy ?? null,
      updatedBy: props.createdBy ?? null,
      version: 0,
      deletedAt: null,
    });
  }

  static fromPersistence(props: VariantProps): VariantEntity {
    return new VariantEntity({
      ...props,
      status: normalizeMenuStatus(props.status),
    });
  }

  rename(name: string, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Variant');
    assertRequired(name, 'variant name');
    this.props.name = name.trim();
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

  toJSON(): VariantProps {
    return { ...this.props };
  }
}
