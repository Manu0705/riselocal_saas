import { PricingEntity } from '../../domain/pricing.entity';
import { MenuRepository } from '../contracts/menu.repository';
import { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import { assertTenantLocation, cloneSnapshot, loadMenuOrThrow, rebuild } from './service-helpers';

interface UpsertPriceInput {
  menuId: string;
  tenantId: string;
  locationId: string;
  itemId: string;
  variantId?: string | null;
  priceId?: string;
  amount: number | null;
  currency?: string;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  changedBy?: string | null;
}

export class PricingService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async upsertPrice(input: UpsertPriceInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const menu = await loadMenuOrThrow(
      this.menuRepository,
      input.menuId,
      input.tenantId,
      input.locationId,
    );

    const snapshot = cloneSnapshot(menu.toJSON());

    const item = snapshot.items.find((entry) => entry.id === input.itemId && entry.deletedAt === null);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.status === 'ARCHIVED') {
      throw new Error('Cannot set pricing for archived item');
    }

    if (input.variantId) {
      const variant = snapshot.variants.find(
        (entry) => entry.id === input.variantId && entry.itemId === input.itemId && entry.deletedAt === null,
      );

      if (!variant) {
        throw new Error('Variant not found for pricing');
      }

      if (variant.status === 'ARCHIVED') {
        throw new Error('Cannot set pricing for archived variant');
      }
    }

    const existingIndex = input.priceId
      ? snapshot.prices.findIndex((entry) => entry.id === input.priceId && entry.deletedAt === null)
      : -1;

    let oldAmount: number | undefined;
    let newAmount: number | undefined;

    if (existingIndex >= 0) {
      const existing = snapshot.prices[existingIndex];
      oldAmount = existing.amount ?? undefined;

      const price = PricingEntity.fromPersistence(existing);
      price.setAmount(input.amount, input.changedBy);
      price.setSchedule(input.effectiveFrom ?? null, input.effectiveTo ?? null, input.changedBy);

      const updated = price.toJSON();
      updated.currency = input.currency ?? updated.currency;
      updated.updatedBy = input.changedBy ?? updated.updatedBy;
      updated.updatedAt = new Date();
      updated.version += 1;

      snapshot.prices[existingIndex] = updated;
      newAmount = updated.amount ?? undefined;
    } else {
      const price = PricingEntity.create({
        tenantId: input.tenantId,
        locationId: input.locationId,
        itemId: input.itemId,
        variantId: input.variantId ?? null,
        amount: input.amount,
        currency: input.currency,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo,
        createdBy: input.changedBy,
      });

      snapshot.prices.push(price.toJSON());
      newAmount = price.toJSON().amount ?? undefined;
    }

    snapshot.menu.updatedBy = input.changedBy ?? snapshot.menu.updatedBy;
    snapshot.menu.updatedAt = new Date();
    snapshot.menu.version += 1;

    await this.menuRepository.update(rebuild(snapshot));

    await this.eventPublisher.publish({
      type: 'PriceChanged',
      payload: {
        itemId: input.itemId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        oldAmount,
        newAmount,
        changedBy: input.changedBy,
      },
    });
  }
}
