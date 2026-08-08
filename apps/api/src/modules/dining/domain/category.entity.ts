import crypto from 'node:crypto';
import type { MenuStatus } from '@saas/domain-core/dining/menu.contract';
import { assertMutable, assertRequired, normalizeMenuStatus } from './domain-guards';

export interface CategoryProps {
  id: string;
  tenantId: string;
  locationId: string;
  menuId: string;
  name: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  status: MenuStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
  deletedAt: Date | null;
}

export interface CreateCategoryProps {
  tenantId: string;
  locationId: string;
  menuId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sortOrder?: number;
  createdBy?: string | null;
}

export class CategoryEntity {
  private readonly props: CategoryProps;

  private constructor(props: CategoryProps) {
    this.props = props;
  }

  static create(props: CreateCategoryProps): CategoryEntity {
    assertRequired(props.tenantId, 'tenantId');
    assertRequired(props.locationId, 'locationId');
    assertRequired(props.menuId, 'menuId');
    assertRequired(props.name, 'category name');

    const now = new Date();

    return new CategoryEntity({
      id: crypto.randomUUID(),
      tenantId: props.tenantId,
      locationId: props.locationId,
      menuId: props.menuId,
      name: props.name.trim(),
      description: props.description ?? null,
      image: props.image ?? null,
      sortOrder: props.sortOrder ?? 0,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy ?? null,
      updatedBy: props.createdBy ?? null,
      version: 0,
      deletedAt: null,
    });
  }

  static fromPersistence(props: CategoryProps): CategoryEntity {
    return new CategoryEntity({
      ...props,
      status: normalizeMenuStatus(props.status),
    });
  }

  rename(name: string, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Category');
    assertRequired(name, 'category name');
    this.props.name = name.trim();
    this.touch(updatedBy);
  }

  reorder(sortOrder: number, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Category');
    this.props.sortOrder = sortOrder;
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

  get menuId(): string {
    return this.props.menuId;
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

  toJSON(): CategoryProps {
    return { ...this.props };
  }
}
