import { prisma } from '@saas/database';
import { MenuAggregate } from '../../domain/menu.aggregate';
import { MenuRepository } from '../../application/contracts/menu.repository';

const menuAggregateInclude = {
  categories: {
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      items: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' as const },
        include: {
          variants: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' as const } },
          addons: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' as const } },
          modifiers: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' as const } },
          prices: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' as const } },
          availabilityState: true,
        },
      },
    },
  },
};

type MenuDelegate = {
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  updateMany(args: unknown): Promise<unknown>;
  findFirst(args: unknown): Promise<any | null>;
  findMany(args: unknown): Promise<any[]>;
};

type MenuCategoryDelegate = {
  updateMany(args: unknown): Promise<unknown>;
  findMany(args: unknown): Promise<any[]>;
  createMany(args: unknown): Promise<unknown>;
  deleteMany(args: unknown): Promise<unknown>;
};

type MenuItemDelegate = {
  updateMany(args: unknown): Promise<unknown>;
  findMany(args: unknown): Promise<any[]>;
  createMany(args: unknown): Promise<unknown>;
  deleteMany(args: unknown): Promise<unknown>;
};

type ItemVariantDelegate = {
  updateMany(args: unknown): Promise<unknown>;
  createMany(args: unknown): Promise<unknown>;
  deleteMany(args: unknown): Promise<unknown>;
};

type ItemAddonDelegate = {
  updateMany(args: unknown): Promise<unknown>;
  createMany(args: unknown): Promise<unknown>;
  deleteMany(args: unknown): Promise<unknown>;
};

type ItemModifierDelegate = {
  updateMany(args: unknown): Promise<unknown>;
  createMany(args: unknown): Promise<unknown>;
  deleteMany(args: unknown): Promise<unknown>;
};

type ItemPriceDelegate = {
  updateMany(args: unknown): Promise<unknown>;
  createMany(args: unknown): Promise<unknown>;
  deleteMany(args: unknown): Promise<unknown>;
};

type ItemAvailabilityDelegate = {
  updateMany(args: unknown): Promise<unknown>;
  createMany(args: unknown): Promise<unknown>;
  deleteMany(args: unknown): Promise<unknown>;
};

type MenuItemImageDelegate = {
  updateMany(args: unknown): Promise<unknown>;
  deleteMany(args: unknown): Promise<unknown>;
};

type DiningTransactionDelegates = {
  menu: MenuDelegate;
  menuCategory: MenuCategoryDelegate;
  menuItem: MenuItemDelegate;
  itemVariant: ItemVariantDelegate;
  itemAddon: ItemAddonDelegate;
  itemModifier: ItemModifierDelegate;
  itemPrice: ItemPriceDelegate;
  itemAvailability: ItemAvailabilityDelegate;
  menuItemImage: MenuItemImageDelegate;
};

function diningDelegates(client: unknown): DiningTransactionDelegates {
  return client as DiningTransactionDelegates;
}

type MenuAggregateRecord = any;

export class PrismaMenuRepository implements MenuRepository {
  async save(menu: MenuAggregate): Promise<void> {
    const snapshot = menu.toJSON();

    await prisma.$transaction(async (tx) => {
      const db = diningDelegates(tx);

      await db.menu.create({
        data: {
          ...snapshot.menu,
        },
      });

      await this.persistChildren(db, snapshot);
    });
  }

  async update(menu: MenuAggregate): Promise<void> {
    const snapshot = menu.toJSON();

    await prisma.$transaction(async (tx) => {
      const db = diningDelegates(tx);

      await db.menu.update({
        where: {
          id: snapshot.menu.id,
          tenantId: snapshot.menu.tenantId,
          locationId: snapshot.menu.locationId,
          deletedAt: null,
        },
        data: {
          name: snapshot.menu.name,
          description: snapshot.menu.description,
          status: snapshot.menu.status,
          sortOrder: snapshot.menu.sortOrder,
          updatedAt: snapshot.menu.updatedAt,
          updatedBy: snapshot.menu.updatedBy,
          version: snapshot.menu.version,
          deletedAt: snapshot.menu.deletedAt,
        },
      });

      await this.clearChildren(db, snapshot.menu.id, snapshot.menu.tenantId, snapshot.menu.locationId);
      await this.persistChildren(db, snapshot);
    });
  }

  async findById(id: string, tenantId: string, locationId: string): Promise<MenuAggregate | null> {
    const db = diningDelegates(prisma);

    const record = await db.menu.findFirst({
      where: {
        id,
        tenantId,
        locationId,
        deletedAt: null,
      },
      include: menuAggregateInclude,
    });

    if (!record) {
      return null;
    }

    return this.mapRecordToAggregate(record);
  }

  async findAllByLocation(tenantId: string, locationId: string): Promise<MenuAggregate[]> {
    const db = diningDelegates(prisma);

    const records = await db.menu.findMany({
      where: {
        tenantId,
        locationId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
      include: menuAggregateInclude,
    });

    return records.map((record: MenuAggregateRecord) => this.mapRecordToAggregate(record));
  }

  async softDelete(
    id: string,
    tenantId: string,
    locationId: string,
    deletedBy?: string | null,
  ): Promise<void> {
    const deletedAt = new Date();

    await prisma.$transaction(async (tx) => {
      const db = diningDelegates(tx);

      await db.menu.updateMany({
        where: { id, tenantId, locationId, deletedAt: null },
        data: {
          status: 'ARCHIVED',
          updatedBy: deletedBy ?? null,
          updatedAt: deletedAt,
          deletedAt,
          version: { increment: 1 },
        },
      });

      await db.menuCategory.updateMany({
        where: { menuId: id, tenantId, locationId, deletedAt: null },
        data: {
          status: 'ARCHIVED',
          updatedBy: deletedBy ?? null,
          updatedAt: deletedAt,
          deletedAt,
          version: { increment: 1 },
        },
      });

      const menuItems = await db.menuItem.findMany({
        where: { tenantId, locationId, category: { menuId: id } },
        select: { id: true },
      });
      const menuItemIds = menuItems.map((item: { id: string }) => item.id);

      if (menuItemIds.length === 0) {
        return;
      }

      await db.menuItem.updateMany({
        where: { id: { in: menuItemIds }, tenantId, locationId, deletedAt: null },
        data: {
          status: 'ARCHIVED',
          updatedBy: deletedBy ?? null,
          updatedAt: deletedAt,
          deletedAt,
          version: { increment: 1 },
        },
      });

      await Promise.all([
        db.itemVariant.updateMany({
          where: { itemId: { in: menuItemIds }, tenantId, locationId, deletedAt: null },
          data: {
            status: 'ARCHIVED',
            updatedBy: deletedBy ?? null,
            updatedAt: deletedAt,
            deletedAt,
            version: { increment: 1 },
          },
        }),
        db.itemAddon.updateMany({
          where: { itemId: { in: menuItemIds }, tenantId, locationId, deletedAt: null },
          data: {
            status: 'ARCHIVED',
            updatedBy: deletedBy ?? null,
            updatedAt: deletedAt,
            deletedAt,
            version: { increment: 1 },
          },
        }),
        db.itemModifier.updateMany({
          where: { itemId: { in: menuItemIds }, tenantId, locationId, deletedAt: null },
          data: {
            status: 'ARCHIVED',
            updatedBy: deletedBy ?? null,
            updatedAt: deletedAt,
            deletedAt,
            version: { increment: 1 },
          },
        }),
        db.itemPrice.updateMany({
          where: { itemId: { in: menuItemIds }, tenantId, locationId, deletedAt: null },
          data: {
            updatedBy: deletedBy ?? null,
            updatedAt: deletedAt,
            deletedAt,
            version: { increment: 1 },
          },
        }),
        db.itemAvailability.updateMany({
          where: { itemId: { in: menuItemIds }, tenantId, locationId, deletedAt: null },
          data: {
            updatedBy: deletedBy ?? null,
            updatedAt: deletedAt,
            deletedAt,
            version: { increment: 1 },
          },
        }),
        db.menuItemImage.updateMany({
          where: { itemId: { in: menuItemIds }, tenantId, locationId, deletedAt: null },
          data: {
            status: 'ARCHIVED',
            updatedBy: deletedBy ?? null,
            updatedAt: deletedAt,
            deletedAt,
            version: { increment: 1 },
          },
        }),
      ]);
    });
  }

  private async clearChildren(
    tx: DiningTransactionDelegates,
    menuId: string,
    tenantId: string,
    locationId: string,
  ): Promise<void> {
    const categories = await tx.menuCategory.findMany({
      where: { menuId, tenantId, locationId },
      select: { id: true },
    });

    const categoryIds = categories.map((category: { id: string }) => category.id);

    if (categoryIds.length === 0) {
      return;
    }

    const items = await tx.menuItem.findMany({
      where: { categoryId: { in: categoryIds }, tenantId, locationId },
      select: { id: true },
    });

    const itemIds = items.map((item: { id: string }) => item.id);

    if (itemIds.length > 0) {
      await Promise.all([
        tx.itemPrice.deleteMany({ where: { itemId: { in: itemIds }, tenantId, locationId } }),
        tx.itemAvailability.deleteMany({ where: { itemId: { in: itemIds }, tenantId, locationId } }),
        tx.itemModifier.deleteMany({ where: { itemId: { in: itemIds }, tenantId, locationId } }),
        tx.itemAddon.deleteMany({ where: { itemId: { in: itemIds }, tenantId, locationId } }),
        tx.itemVariant.deleteMany({ where: { itemId: { in: itemIds }, tenantId, locationId } }),
        tx.menuItemImage.deleteMany({ where: { itemId: { in: itemIds }, tenantId, locationId } }),
      ]);
    }

    await tx.menuItem.deleteMany({ where: { categoryId: { in: categoryIds }, tenantId, locationId } });
    await tx.menuCategory.deleteMany({ where: { menuId, tenantId, locationId } });
  }

  private async persistChildren(
    tx: DiningTransactionDelegates,
    snapshot: ReturnType<MenuAggregate['toJSON']>,
  ): Promise<void> {
    if (snapshot.categories.length > 0) {
      await tx.menuCategory.createMany({
        data: snapshot.categories,
      });
    }

    if (snapshot.items.length > 0) {
      await tx.menuItem.createMany({
        data: snapshot.items,
      });
    }

    if (snapshot.variants.length > 0) {
      await tx.itemVariant.createMany({
        data: snapshot.variants,
      });
    }

    if (snapshot.addons.length > 0) {
      await tx.itemAddon.createMany({
        data: snapshot.addons,
      });
    }

    if (snapshot.modifiers.length > 0) {
      await tx.itemModifier.createMany({
        data: snapshot.modifiers,
      });
    }

    if (snapshot.prices.length > 0) {
      await tx.itemPrice.createMany({
        data: snapshot.prices,
      });
    }

    if (snapshot.availabilities.length > 0) {
      await tx.itemAvailability.createMany({
        data: snapshot.availabilities,
      });
    }
  }

  private mapRecordToAggregate(record: MenuAggregateRecord): MenuAggregate {
    const categories = record.categories.map((category: any) => ({
      id: category.id,
      tenantId: category.tenantId,
      locationId: category.locationId,
      menuId: category.menuId,
      name: category.name,
      description: category.description,
      image: category.image,
      sortOrder: category.sortOrder,
      status: category.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      createdBy: category.createdBy,
      updatedBy: category.updatedBy,
      version: category.version,
      deletedAt: category.deletedAt,
    }));

    const items = record.categories.flatMap((category: any) =>
      category.items.map((item: any) => ({
        id: item.id,
        tenantId: item.tenantId,
        locationId: item.locationId,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        shortDescription: item.shortDescription,
        image: item.image,
        basePrice: item.basePrice,
        itemType: item.itemType as 'STANDARD' | 'VARIABLE' | 'COMBO' | 'SERVICE',
        kitchenStationId: item.kitchenStationId,
        status: item.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
        availability: item.availability as
          | 'AVAILABLE'
          | 'OUT_OF_STOCK'
          | 'TEMPORARILY_UNAVAILABLE'
          | 'DISABLED',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdBy: item.createdBy,
        updatedBy: item.updatedBy,
        version: item.version,
        deletedAt: item.deletedAt,
      })),
    );

    const variants = record.categories.flatMap((category: any) =>
      category.items.flatMap((item: any) =>
        item.variants.map((variant: any) => ({
          id: variant.id,
          tenantId: variant.tenantId,
          locationId: variant.locationId,
          itemId: variant.itemId,
          name: variant.name,
          priceAdjustment: variant.priceAdjustment,
          sku: variant.sku,
          status: variant.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
          createdAt: variant.createdAt,
          updatedAt: variant.updatedAt,
          createdBy: variant.createdBy,
          updatedBy: variant.updatedBy,
          version: variant.version,
          deletedAt: variant.deletedAt,
        })),
      ),
    );

    const addons = record.categories.flatMap((category: any) =>
      category.items.flatMap((item: any) =>
        item.addons.map((addon: any) => ({
          id: addon.id,
          tenantId: addon.tenantId,
          locationId: addon.locationId,
          itemId: addon.itemId,
          name: addon.name,
          price: addon.price,
          maxQuantity: addon.maxQuantity,
          status: addon.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
          createdAt: addon.createdAt,
          updatedAt: addon.updatedAt,
          createdBy: addon.createdBy,
          updatedBy: addon.updatedBy,
          version: addon.version,
          deletedAt: addon.deletedAt,
        })),
      ),
    );

    const modifiers = record.categories.flatMap((category: any) =>
      category.items.flatMap((item: any) =>
        item.modifiers.map((modifier: any) => ({
          id: modifier.id,
          tenantId: modifier.tenantId,
          locationId: modifier.locationId,
          itemId: modifier.itemId,
          name: modifier.name,
          type: modifier.type as 'TEXT' | 'OPTION' | 'BOOLEAN',
          status: modifier.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
          createdAt: modifier.createdAt,
          updatedAt: modifier.updatedAt,
          createdBy: modifier.createdBy,
          updatedBy: modifier.updatedBy,
          version: modifier.version,
          deletedAt: modifier.deletedAt,
        })),
      ),
    );

    const prices = record.categories.flatMap((category: any) =>
      category.items.flatMap((item: any) =>
        item.prices.map((price: any) => ({
          id: price.id,
          tenantId: price.tenantId,
          locationId: price.locationId,
          itemId: price.itemId,
          variantId: price.variantId,
          amount: price.amount,
          currency: price.currency,
          effectiveFrom: price.effectiveFrom,
          effectiveTo: price.effectiveTo,
          createdAt: price.createdAt,
          updatedAt: price.updatedAt,
          createdBy: price.createdBy,
          updatedBy: price.updatedBy,
          version: price.version,
          deletedAt: price.deletedAt,
        })),
      ),
    );

    const availabilities = record.categories.flatMap((category: any) =>
      category.items
        .filter((item: any) => item.availabilityState !== null)
        .map((item: any) => {
          const availability = item.availabilityState;

          if (!availability) {
            throw new Error('Availability unexpectedly missing for menu item');
          }

          return {
            id: availability.id,
            tenantId: availability.tenantId,
            locationId: availability.locationId,
            itemId: availability.itemId,
            status: availability.status as
              | 'AVAILABLE'
              | 'OUT_OF_STOCK'
              | 'TEMPORARILY_UNAVAILABLE'
              | 'DISABLED',
            reason: availability.reason,
            updatedBy: availability.updatedBy,
            createdAt: availability.createdAt,
            updatedAt: availability.updatedAt,
            version: availability.version,
            deletedAt: availability.deletedAt,
          };
        }),
    );

    return MenuAggregate.fromPersistence({
      menu: {
        id: record.id,
        tenantId: record.tenantId,
        locationId: record.locationId,
        name: record.name,
        description: record.description,
        status: record.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
        sortOrder: record.sortOrder,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        createdBy: record.createdBy,
        updatedBy: record.updatedBy,
        version: record.version,
        deletedAt: record.deletedAt,
      },
      categories,
      items,
      variants,
      addons,
      modifiers,
      prices,
      availabilities,
    });
  }
}
