import crypto from 'node:crypto';
import type { MenuStatus, ModifierType } from '@saas/domain-core/dining/menu.contract';
import {
  assertMutable,
  assertRequired,
  normalizeMenuStatus,
  normalizeModifierType,
} from './domain-guards';

export interface ModifierProps {
  id: string;
  tenantId: string;
  locationId: string;
  itemId: string;
  name: string;
  type: ModifierType;
  status: MenuStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
  deletedAt: Date | null;
}

export interface CreateModifierProps {
  tenantId: string;
  locationId: string;
  itemId: string;
  name: string;
  type?: ModifierType;
  createdBy?: string | null;
}

export class ModifierEntity {
  private readonly props: ModifierProps;

  private constructor(props: ModifierProps) {
    this.props = props;
  }

  static create(props: CreateModifierProps): ModifierEntity {
    assertRequired(props.tenantId, 'tenantId');
    assertRequired(props.locationId, 'locationId');
    assertRequired(props.itemId, 'itemId');
    assertRequired(props.name, 'modifier name');

    const now = new Date();

    return new ModifierEntity({
      id: crypto.randomUUID(),
      tenantId: props.tenantId,
      locationId: props.locationId,
      itemId: props.itemId,
      name: props.name.trim(),
      type: normalizeModifierType(props.type),
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy ?? null,
      updatedBy: props.createdBy ?? null,
      version: 0,
      deletedAt: null,
    });
  }

  static fromPersistence(props: ModifierProps): ModifierEntity {
    return new ModifierEntity({
      ...props,
      status: normalizeMenuStatus(props.status),
      type: normalizeModifierType(props.type),
    });
  }

  rename(name: string, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Modifier');
    assertRequired(name, 'modifier name');
    this.props.name = name.trim();
    this.touch(updatedBy);
  }

  changeType(type: ModifierType, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Modifier');
    this.props.type = normalizeModifierType(type);
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

  toJSON(): ModifierProps {
    return { ...this.props };
  }
}
