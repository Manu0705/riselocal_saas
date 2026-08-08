import crypto from 'node:crypto';
import type { KitchenStationStatus } from '@saas/domain-core/dining/menu.contract';
import {
  assertRequired,
  normalizeStationStatus,
} from './domain-guards';

export interface KitchenStationProps {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  status: KitchenStationStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
  deletedAt: Date | null;
}

export interface CreateKitchenStationProps {
  tenantId: string;
  locationId: string;
  name: string;
  status?: KitchenStationStatus;
  createdBy?: string | null;
}

export class KitchenStationEntity {
  private readonly props: KitchenStationProps;

  private constructor(props: KitchenStationProps) {
    this.props = props;
  }

  static create(props: CreateKitchenStationProps): KitchenStationEntity {
    assertRequired(props.tenantId, 'tenantId');
    assertRequired(props.locationId, 'locationId');
    assertRequired(props.name, 'kitchen station name');

    const now = new Date();

    return new KitchenStationEntity({
      id: crypto.randomUUID(),
      tenantId: props.tenantId,
      locationId: props.locationId,
      name: props.name.trim(),
      status: normalizeStationStatus(props.status),
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy ?? null,
      updatedBy: props.createdBy ?? null,
      version: 0,
      deletedAt: null,
    });
  }

  static fromPersistence(props: KitchenStationProps): KitchenStationEntity {
    return new KitchenStationEntity({
      ...props,
      status: normalizeStationStatus(props.status),
    });
  }

  rename(name: string, updatedBy?: string | null): void {
    assertRequired(name, 'kitchen station name');
    this.props.name = name.trim();
    this.touch(updatedBy);
  }

  activate(updatedBy?: string | null): void {
    this.props.status = 'ACTIVE';
    this.touch(updatedBy);
  }

  deactivate(updatedBy?: string | null): void {
    this.props.status = 'INACTIVE';
    this.touch(updatedBy);
  }

  archive(updatedBy?: string | null): void {
    this.props.status = 'INACTIVE';
    this.props.deletedAt = new Date();
    this.touch(updatedBy);
  }

  private touch(updatedBy?: string | null): void {
    this.props.updatedBy = updatedBy ?? this.props.updatedBy;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get locationId(): string {
    return this.props.locationId;
  }

  toJSON(): KitchenStationProps {
    return { ...this.props };
  }
}
