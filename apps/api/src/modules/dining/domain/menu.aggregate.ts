import crypto from 'node:crypto';
import type { MenuStatus } from '@saas/domain-core/dining/menu.contract';
import { assertMutable, assertRequired, normalizeMenuStatus } from './domain-guards';
import { CategoryEntity, type CategoryProps } from './category.entity';
import { ItemEntity, type ItemProps } from './item.entity';
import { VariantEntity, type VariantProps } from './variant.entity';
import { AddonEntity, type AddonProps } from './addon.entity';
import { ModifierEntity, type ModifierProps } from './modifier.entity';
import { PricingEntity, type PricingProps } from './pricing.entity';
import { AvailabilityEntity, type AvailabilityProps } from './availability.entity';

export interface MenuProps {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  description: string | null;
  status: MenuStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;
  deletedAt: Date | null;
}

export interface CreateMenuProps {
  tenantId: string;
  locationId: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  createdBy?: string | null;
}

export interface MenuAggregateSnapshot {
  menu: MenuProps;
  categories: CategoryProps[];
  items: ItemProps[];
  variants: VariantProps[];
  addons: AddonProps[];
  modifiers: ModifierProps[];
  prices: PricingProps[];
  availabilities: AvailabilityProps[];
}

export class MenuAggregate {
  private readonly props: MenuProps;
  private readonly categories: CategoryEntity[];
  private readonly items: ItemEntity[];
  private readonly variants: VariantEntity[];
  private readonly addons: AddonEntity[];
  private readonly modifiers: ModifierEntity[];
  private readonly prices: PricingEntity[];
  private readonly availabilities: AvailabilityEntity[];

  private constructor(snapshot: MenuAggregateSnapshot) {
    this.props = {
      ...snapshot.menu,
      status: normalizeMenuStatus(snapshot.menu.status),
    };
    this.categories = snapshot.categories.map((category) => CategoryEntity.fromPersistence(category));
    this.items = snapshot.items.map((item) => ItemEntity.fromPersistence(item));
    this.variants = snapshot.variants.map((variant) => VariantEntity.fromPersistence(variant));
    this.addons = snapshot.addons.map((addon) => AddonEntity.fromPersistence(addon));
    this.modifiers = snapshot.modifiers.map((modifier) => ModifierEntity.fromPersistence(modifier));
    this.prices = snapshot.prices.map((price) => PricingEntity.fromPersistence(price));
    this.availabilities = snapshot.availabilities.map((availability) =>
      AvailabilityEntity.fromPersistence(availability),
    );

    this.assertInvariants();
  }

  static create(props: CreateMenuProps): MenuAggregate {
    assertRequired(props.tenantId, 'tenantId');
    assertRequired(props.locationId, 'locationId');
    assertRequired(props.name, 'menu name');

    const now = new Date();

    return new MenuAggregate({
      menu: {
        id: crypto.randomUUID(),
        tenantId: props.tenantId,
        locationId: props.locationId,
        name: props.name.trim(),
        description: props.description ?? null,
        status: 'ACTIVE',
        sortOrder: props.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
        createdBy: props.createdBy ?? null,
        updatedBy: props.createdBy ?? null,
        version: 0,
        deletedAt: null,
      },
      categories: [],
      items: [],
      variants: [],
      addons: [],
      modifiers: [],
      prices: [],
      availabilities: [],
    });
  }

  static fromPersistence(snapshot: MenuAggregateSnapshot): MenuAggregate {
    return new MenuAggregate(snapshot);
  }

  rename(name: string, updatedBy?: string | null): void {
    assertMutable(this.props.status, 'Menu');
    assertRequired(name, 'menu name');
    this.props.name = name.trim();
    this.touch(updatedBy);
  }

  addCategory(category: CategoryEntity): void {
    this.assertMutable();
    this.assertScope(category.tenantId, category.locationId, 'category');
    if (category.menuId !== this.props.id) {
      throw new Error('Category menuId does not match aggregate menu id');
    }
    this.categories.push(category);
  }

  addItem(item: ItemEntity): void {
    this.assertMutable();
    this.assertScope(item.tenantId, item.locationId, 'item');
    const hasCategory = this.categories.some((category) => category.id === item.categoryId);
    if (!hasCategory) {
      throw new Error('Item categoryId does not exist in aggregate');
    }
    this.items.push(item);
  }

  addVariant(variant: VariantEntity): void {
    this.assertMutable();
    this.assertScope(variant.tenantId, variant.locationId, 'variant');
    this.assertItemExists(variant.itemId, 'Variant');
    this.variants.push(variant);
  }

  addAddon(addon: AddonEntity): void {
    this.assertMutable();
    this.assertScope(addon.tenantId, addon.locationId, 'addon');
    this.assertItemExists(addon.itemId, 'Addon');
    this.addons.push(addon);
  }

  addModifier(modifier: ModifierEntity): void {
    this.assertMutable();
    this.assertScope(modifier.tenantId, modifier.locationId, 'modifier');
    this.assertItemExists(modifier.itemId, 'Modifier');
    this.modifiers.push(modifier);
  }

  addPrice(pricing: PricingEntity): void {
    this.assertMutable();
    this.assertScope(pricing.tenantId, pricing.locationId, 'pricing');
    this.assertItemExists(pricing.itemId, 'Pricing');

    if (pricing.variantId) {
      const hasVariant = this.variants.some((variant) => variant.id === pricing.variantId);
      if (!hasVariant) {
        throw new Error('Pricing variantId does not exist in aggregate');
      }
    }

    this.prices.push(pricing);
  }

  addAvailability(availability: AvailabilityEntity): void {
    this.assertMutable();
    this.assertScope(availability.tenantId, availability.locationId, 'availability');
    this.assertItemExists(availability.itemId, 'Availability');

    const alreadyExists = this.availabilities.some(
      (state) => state.itemId === availability.itemId && state.toJSON().deletedAt === null,
    );

    if (alreadyExists) {
      throw new Error('Item availability already exists for this item');
    }

    this.availabilities.push(availability);
  }

  archive(updatedBy?: string | null): void {
    this.props.status = 'ARCHIVED';
    this.props.deletedAt = new Date();
    this.touch(updatedBy);
  }

  private assertInvariants(): void {
    for (const category of this.categories) {
      this.assertScope(category.tenantId, category.locationId, 'category');
      if (category.menuId !== this.props.id) {
        throw new Error(`Category ${category.id} points to a different menu`);
      }
    }

    for (const item of this.items) {
      this.assertScope(item.tenantId, item.locationId, 'item');
      const hasCategory = this.categories.some((category) => category.id === item.categoryId);
      if (!hasCategory) {
        throw new Error(`Item ${item.id} points to a missing category`);
      }
    }

    for (const variant of this.variants) {
      this.assertScope(variant.tenantId, variant.locationId, 'variant');
      this.assertItemExists(variant.itemId, `Variant ${variant.id}`);
    }

    for (const addon of this.addons) {
      this.assertScope(addon.tenantId, addon.locationId, 'addon');
      this.assertItemExists(addon.itemId, `Addon ${addon.id}`);
    }

    for (const modifier of this.modifiers) {
      this.assertScope(modifier.tenantId, modifier.locationId, 'modifier');
      this.assertItemExists(modifier.itemId, `Modifier ${modifier.id}`);
    }

    for (const pricing of this.prices) {
      this.assertScope(pricing.tenantId, pricing.locationId, 'pricing');
      this.assertItemExists(pricing.itemId, `Pricing ${pricing.id}`);
      if (pricing.variantId) {
        const hasVariant = this.variants.some((variant) => variant.id === pricing.variantId);
        if (!hasVariant) {
          throw new Error(`Pricing ${pricing.id} points to a missing variant`);
        }
      }
    }

    const seenAvailabilityByItem = new Set<string>();
    for (const availability of this.availabilities) {
      this.assertScope(availability.tenantId, availability.locationId, 'availability');
      this.assertItemExists(availability.itemId, `Availability ${availability.id}`);
      if (seenAvailabilityByItem.has(availability.itemId)) {
        throw new Error(`Duplicate availability state for item ${availability.itemId}`);
      }
      seenAvailabilityByItem.add(availability.itemId);
    }
  }

  private assertMutable(): void {
    assertMutable(this.props.status, 'Menu');
  }

  private assertScope(tenantId: string, locationId: string, entityName: string): void {
    if (tenantId !== this.props.tenantId) {
      throw new Error(`Mismatched tenant for ${entityName}`);
    }

    if (locationId !== this.props.locationId) {
      throw new Error(`Mismatched location for ${entityName}`);
    }
  }

  private assertItemExists(itemId: string, entityName: string): void {
    const hasItem = this.items.some((item) => item.id === itemId);
    if (!hasItem) {
      throw new Error(`${entityName} points to a missing item`);
    }
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

  toJSON(): MenuAggregateSnapshot {
    return {
      menu: { ...this.props },
      categories: this.categories.map((category) => category.toJSON()),
      items: this.items.map((item) => item.toJSON()),
      variants: this.variants.map((variant) => variant.toJSON()),
      addons: this.addons.map((addon) => addon.toJSON()),
      modifiers: this.modifiers.map((modifier) => modifier.toJSON()),
      prices: this.prices.map((pricing) => pricing.toJSON()),
      availabilities: this.availabilities.map((availability) => availability.toJSON()),
    };
  }
}
