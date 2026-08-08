import crypto from 'node:crypto';
import { assertNonNegative, assertRequired } from './domain-guards';

export interface PricingProps {
  id: string;
  tenantId: string;
  locationId: string;
  itemId: string;
  variantId: string | null;
  amount: number | null;
  currency: string;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
  deletedAt: Date | null;
}

export interface CreatePricingProps {
  tenantId: string;
  locationId: string;
  itemId: string;
  variantId?: string | null;
  amount?: number | null;
  currency?: string;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  createdBy?: string | null;
}

export class PricingEntity {
  private readonly props: PricingProps;

  private constructor(props: PricingProps) {
    this.props = props;
  }

  static create(props: CreatePricingProps): PricingEntity {
    assertRequired(props.tenantId, 'tenantId');
    assertRequired(props.locationId, 'locationId');
    assertRequired(props.itemId, 'itemId');

    if (props.amount !== undefined && props.amount !== null) {
      assertNonNegative(props.amount, 'price amount');
    }

    if (props.effectiveFrom && props.effectiveTo && props.effectiveFrom > props.effectiveTo) {
      throw new Error('effectiveFrom must be less than or equal to effectiveTo');
    }

    const now = new Date();

    return new PricingEntity({
      id: crypto.randomUUID(),
      tenantId: props.tenantId,
      locationId: props.locationId,
      itemId: props.itemId,
      variantId: props.variantId ?? null,
      amount: props.amount ?? null,
      currency: props.currency ?? 'INR',
      effectiveFrom: props.effectiveFrom ?? null,
      effectiveTo: props.effectiveTo ?? null,
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy ?? null,
      updatedBy: props.createdBy ?? null,
      version: 0,
      deletedAt: null,
    });
  }

  static fromPersistence(props: PricingProps): PricingEntity {
    if (props.amount !== null) {
      assertNonNegative(props.amount, 'price amount');
    }

    if (props.effectiveFrom && props.effectiveTo && props.effectiveFrom > props.effectiveTo) {
      throw new Error('effectiveFrom must be less than or equal to effectiveTo');
    }

    return new PricingEntity(props);
  }

  setAmount(amount: number | null, updatedBy?: string | null): void {
    if (amount !== null) {
      assertNonNegative(amount, 'price amount');
    }

    this.props.amount = amount;
    this.touch(updatedBy);
  }

  setSchedule(
    effectiveFrom: Date | null,
    effectiveTo: Date | null,
    updatedBy?: string | null,
  ): void {
    if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
      throw new Error('effectiveFrom must be less than or equal to effectiveTo');
    }

    this.props.effectiveFrom = effectiveFrom;
    this.props.effectiveTo = effectiveTo;
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

  get itemId(): string {
    return this.props.itemId;
  }

  get variantId(): string | null {
    return this.props.variantId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get locationId(): string {
    return this.props.locationId;
  }

  toJSON(): PricingProps {
    return { ...this.props };
  }
}
