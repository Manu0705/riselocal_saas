import crypto from 'node:crypto';
import type { AvailabilityStatus } from '@saas/domain-core/dining/menu.contract';
import {
  assertAvailabilityTransition,
  assertRequired,
  normalizeAvailabilityStatus,
} from './domain-guards';

export interface AvailabilityProps {
  id: string;
  tenantId: string;
  locationId: string;
  itemId: string;
  status: AvailabilityStatus;
  reason: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  deletedAt: Date | null;
}

export interface CreateAvailabilityProps {
  tenantId: string;
  locationId: string;
  itemId: string;
  status?: AvailabilityStatus;
  reason?: string | null;
  updatedBy?: string | null;
}

export class AvailabilityEntity {
  private readonly props: AvailabilityProps;

  private constructor(props: AvailabilityProps) {
    this.props = props;
  }

  static create(props: CreateAvailabilityProps): AvailabilityEntity {
    assertRequired(props.tenantId, 'tenantId');
    assertRequired(props.locationId, 'locationId');
    assertRequired(props.itemId, 'itemId');

    const now = new Date();

    return new AvailabilityEntity({
      id: crypto.randomUUID(),
      tenantId: props.tenantId,
      locationId: props.locationId,
      itemId: props.itemId,
      status: normalizeAvailabilityStatus(props.status),
      reason: props.reason ?? null,
      updatedBy: props.updatedBy ?? null,
      createdAt: now,
      updatedAt: now,
      version: 0,
      deletedAt: null,
    });
  }

  static fromPersistence(props: AvailabilityProps): AvailabilityEntity {
    return new AvailabilityEntity({
      ...props,
      status: normalizeAvailabilityStatus(props.status),
    });
  }

  transitionTo(status: AvailabilityStatus, reason?: string | null, updatedBy?: string | null): void {
    const next = normalizeAvailabilityStatus(status);
    assertAvailabilityTransition(this.props.status, next);

    this.props.status = next;
    this.props.reason = reason ?? this.props.reason;
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

  get status(): AvailabilityStatus {
    return this.props.status;
  }

  toJSON(): AvailabilityProps {
    return { ...this.props };
  }
}
