import type { MenuItemType, ModifierType } from '@saas/domain-core/dining/menu.contract';
import { ItemEntity } from '../../domain/item.entity';
import { ModifierEntity } from '../../domain/modifier.entity';
import { VariantEntity } from '../../domain/variant.entity';
import { MenuRepository } from '../contracts/menu.repository';
import { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import { assertTenantLocation, cloneSnapshot, loadMenuOrThrow, rebuild } from './service-helpers';

interface CreateItemInput {
  menuId: string;
  categoryId: string;
  tenantId: string;
  locationId: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: string | null;
  basePrice?: number | null;
  itemType?: MenuItemType;
  createdBy?: string | null;
}

interface AddVariantInput {
  menuId: string;
  itemId: string;
  tenantId: string;
  locationId: string;
  name: string;
  priceAdjustment?: number | null;
  sku?: string | null;
  createdBy?: string | null;
}

interface AddModifierInput {
  menuId: string;
  itemId: string;
  tenantId: string;
  locationId: string;
  name: string;
  type?: ModifierType;
  createdBy?: string | null;
}

interface ArchiveItemInput {
  menuId: string;
  itemId: string;
  tenantId: string;
  locationId: string;
  archivedBy?: string | null;
}

export class MenuItemService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async createItem(input: CreateItemInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const menu = await loadMenuOrThrow(
      this.menuRepository,
      input.menuId,
      input.tenantId,
      input.locationId,
    );

    const snapshot = menu.toJSON();
    const category = snapshot.categories.find(
      (entry) => entry.id === input.categoryId && entry.deletedAt === null,
    );

    if (!category) {
      throw new Error('Category not found');
    }

    if (category.status === 'ARCHIVED') {
      throw new Error('Cannot add items to archived category');
    }

    const item = ItemEntity.create({
      tenantId: input.tenantId,
      locationId: input.locationId,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      shortDescription: input.shortDescription,
      image: input.image,
      basePrice: input.basePrice,
      itemType: input.itemType,
      createdBy: input.createdBy,
    });

    menu.addItem(item);
    await this.menuRepository.update(menu);

    await this.eventPublisher.publish({
      type: 'MenuUpdated',
      payload: {
        menuId: input.menuId,
        tenantId: input.tenantId,
        locationId: input.locationId,
      },
    });

    return item.toJSON();
  }

  async addVariant(input: AddVariantInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const menu = await loadMenuOrThrow(
      this.menuRepository,
      input.menuId,
      input.tenantId,
      input.locationId,
    );

    const snapshot = menu.toJSON();
    const item = snapshot.items.find((entry) => entry.id === input.itemId && entry.deletedAt === null);

    if (!item) {
      throw new Error('Item not found');
    }

    if (item.status === 'ARCHIVED') {
      throw new Error('Cannot add variants to archived item');
    }

    if (item.itemType !== 'VARIABLE' && item.itemType !== 'COMBO') {
      throw new Error('Variants are allowed only for VARIABLE or COMBO item types');
    }

    const hasDuplicateName = snapshot.variants.some(
      (variant) =>
        variant.itemId === input.itemId
        && variant.deletedAt === null
        && variant.name.toLowerCase() === input.name.trim().toLowerCase(),
    );

    if (hasDuplicateName) {
      throw new Error('Variant name must be unique per item');
    }

    const variant = VariantEntity.create({
      tenantId: input.tenantId,
      locationId: input.locationId,
      itemId: input.itemId,
      name: input.name,
      priceAdjustment: input.priceAdjustment,
      sku: input.sku,
      createdBy: input.createdBy,
    });

    menu.addVariant(variant);
    await this.menuRepository.update(menu);

    await this.eventPublisher.publish({
      type: 'MenuUpdated',
      payload: {
        menuId: input.menuId,
        tenantId: input.tenantId,
        locationId: input.locationId,
      },
    });

    return variant.toJSON();
  }

  async addModifier(input: AddModifierInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const menu = await loadMenuOrThrow(
      this.menuRepository,
      input.menuId,
      input.tenantId,
      input.locationId,
    );

    const snapshot = menu.toJSON();
    const item = snapshot.items.find((entry) => entry.id === input.itemId && entry.deletedAt === null);

    if (!item) {
      throw new Error('Item not found');
    }

    if (item.status === 'ARCHIVED') {
      throw new Error('Cannot add modifiers to archived item');
    }

    const hasDuplicateName = snapshot.modifiers.some(
      (modifier) =>
        modifier.itemId === input.itemId
        && modifier.deletedAt === null
        && modifier.name.toLowerCase() === input.name.trim().toLowerCase(),
    );

    if (hasDuplicateName) {
      throw new Error('Modifier name must be unique per item');
    }

    const modifier = ModifierEntity.create({
      tenantId: input.tenantId,
      locationId: input.locationId,
      itemId: input.itemId,
      name: input.name,
      type: input.type,
      createdBy: input.createdBy,
    });

    menu.addModifier(modifier);
    await this.menuRepository.update(menu);

    await this.eventPublisher.publish({
      type: 'MenuUpdated',
      payload: {
        menuId: input.menuId,
        tenantId: input.tenantId,
        locationId: input.locationId,
      },
    });

    return modifier.toJSON();
  }

  async archiveItem(input: ArchiveItemInput): Promise<void> {
    assertTenantLocation(input.tenantId, input.locationId);

    const menu = await loadMenuOrThrow(
      this.menuRepository,
      input.menuId,
      input.tenantId,
      input.locationId,
    );

    const snapshot = cloneSnapshot(menu.toJSON());

    const itemIndex = snapshot.items.findIndex(
      (entry) => entry.id === input.itemId && entry.deletedAt === null,
    );

    if (itemIndex < 0) {
      throw new Error('Item not found');
    }

    const item = ItemEntity.fromPersistence(snapshot.items[itemIndex]);
    item.archive(input.archivedBy);
    snapshot.items[itemIndex] = item.toJSON();

    const now = new Date();

    for (let idx = 0; idx < snapshot.variants.length; idx += 1) {
      const variant = snapshot.variants[idx];
      if (variant.itemId === input.itemId && variant.deletedAt === null) {
        snapshot.variants[idx] = {
          ...variant,
          status: 'ARCHIVED',
          deletedAt: now,
          updatedBy: input.archivedBy ?? variant.updatedBy,
          updatedAt: now,
          version: variant.version + 1,
        };
      }
    }

    for (let idx = 0; idx < snapshot.addons.length; idx += 1) {
      const addon = snapshot.addons[idx];
      if (addon.itemId === input.itemId && addon.deletedAt === null) {
        snapshot.addons[idx] = {
          ...addon,
          status: 'ARCHIVED',
          deletedAt: now,
          updatedBy: input.archivedBy ?? addon.updatedBy,
          updatedAt: now,
          version: addon.version + 1,
        };
      }
    }

    for (let idx = 0; idx < snapshot.modifiers.length; idx += 1) {
      const modifier = snapshot.modifiers[idx];
      if (modifier.itemId === input.itemId && modifier.deletedAt === null) {
        snapshot.modifiers[idx] = {
          ...modifier,
          status: 'ARCHIVED',
          deletedAt: now,
          updatedBy: input.archivedBy ?? modifier.updatedBy,
          updatedAt: now,
          version: modifier.version + 1,
        };
      }
    }

    for (let idx = 0; idx < snapshot.prices.length; idx += 1) {
      const price = snapshot.prices[idx];
      if (price.itemId === input.itemId && price.deletedAt === null) {
        snapshot.prices[idx] = {
          ...price,
          deletedAt: now,
          updatedBy: input.archivedBy ?? price.updatedBy,
          updatedAt: now,
          version: price.version + 1,
        };
      }
    }

    for (let idx = 0; idx < snapshot.availabilities.length; idx += 1) {
      const availability = snapshot.availabilities[idx];
      if (availability.itemId === input.itemId && availability.deletedAt === null) {
        snapshot.availabilities[idx] = {
          ...availability,
          deletedAt: now,
          updatedBy: input.archivedBy ?? availability.updatedBy,
          updatedAt: now,
          version: availability.version + 1,
        };
      }
    }

    snapshot.menu.updatedBy = input.archivedBy ?? snapshot.menu.updatedBy;
    snapshot.menu.updatedAt = now;
    snapshot.menu.version += 1;

    await this.menuRepository.update(rebuild(snapshot));

    await this.eventPublisher.publish({
      type: 'ItemArchived',
      payload: {
        itemId: input.itemId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        archivedBy: input.archivedBy,
      },
    });
  }
}
