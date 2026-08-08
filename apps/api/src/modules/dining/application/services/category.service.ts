import { CategoryEntity } from '../../domain/category.entity';
import { MenuRepository } from '../contracts/menu.repository';
import { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import { assertTenantLocation, cloneSnapshot, loadMenuOrThrow, rebuild } from './service-helpers';

interface CreateCategoryInput {
  menuId: string;
  tenantId: string;
  locationId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sortOrder?: number;
  createdBy?: string | null;
}

interface ArchiveCategoryInput {
  menuId: string;
  categoryId: string;
  tenantId: string;
  locationId: string;
  archivedBy?: string | null;
}

export class CategoryService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async createCategory(input: CreateCategoryInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const menu = await loadMenuOrThrow(
      this.menuRepository,
      input.menuId,
      input.tenantId,
      input.locationId,
    );

    const category = CategoryEntity.create({
      tenantId: input.tenantId,
      locationId: input.locationId,
      menuId: input.menuId,
      name: input.name,
      description: input.description,
      image: input.image,
      sortOrder: input.sortOrder,
      createdBy: input.createdBy,
    });

    menu.addCategory(category);
    await this.menuRepository.update(menu);

    await this.eventPublisher.publish({
      type: 'MenuUpdated',
      payload: {
        menuId: input.menuId,
        tenantId: input.tenantId,
        locationId: input.locationId,
      },
    });

    return category.toJSON();
  }

  async archiveCategory(input: ArchiveCategoryInput): Promise<void> {
    assertTenantLocation(input.tenantId, input.locationId);

    const menu = await loadMenuOrThrow(
      this.menuRepository,
      input.menuId,
      input.tenantId,
      input.locationId,
    );

    const snapshot = cloneSnapshot(menu.toJSON());

    const categoryIndex = snapshot.categories.findIndex(
      (category) => category.id === input.categoryId && category.deletedAt === null,
    );

    if (categoryIndex < 0) {
      throw new Error('Category not found');
    }

    const category = CategoryEntity.fromPersistence(snapshot.categories[categoryIndex]);
    category.archive(input.archivedBy);
    snapshot.categories[categoryIndex] = category.toJSON();

    const now = new Date();
    const categoryItemIds = snapshot.items
      .filter((item) => item.categoryId === input.categoryId && item.deletedAt === null)
      .map((item) => item.id);

    if (categoryItemIds.length > 0) {
      for (let idx = 0; idx < snapshot.items.length; idx += 1) {
        const item = snapshot.items[idx];
        if (categoryItemIds.includes(item.id) && item.deletedAt === null) {
          snapshot.items[idx] = {
            ...item,
            status: 'ARCHIVED',
            deletedAt: now,
            updatedBy: input.archivedBy ?? item.updatedBy,
            updatedAt: now,
            version: item.version + 1,
          };
        }
      }

      for (let idx = 0; idx < snapshot.variants.length; idx += 1) {
        const variant = snapshot.variants[idx];
        if (categoryItemIds.includes(variant.itemId) && variant.deletedAt === null) {
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
        if (categoryItemIds.includes(addon.itemId) && addon.deletedAt === null) {
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
        if (categoryItemIds.includes(modifier.itemId) && modifier.deletedAt === null) {
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
        if (categoryItemIds.includes(price.itemId) && price.deletedAt === null) {
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
        if (categoryItemIds.includes(availability.itemId) && availability.deletedAt === null) {
          snapshot.availabilities[idx] = {
            ...availability,
            deletedAt: now,
            updatedBy: input.archivedBy ?? availability.updatedBy,
            updatedAt: now,
            version: availability.version + 1,
          };
        }
      }
    }

    snapshot.menu.updatedBy = input.archivedBy ?? snapshot.menu.updatedBy;
    snapshot.menu.updatedAt = now;
    snapshot.menu.version += 1;

    await this.menuRepository.update(rebuild(snapshot));

    await this.eventPublisher.publish({
      type: 'MenuUpdated',
      payload: {
        menuId: input.menuId,
        tenantId: input.tenantId,
        locationId: input.locationId,
      },
    });
  }
}
