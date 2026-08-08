import { MenuRepository } from '../contracts/menu.repository';
import type { MenuAggregateSnapshot } from '../../domain/menu.aggregate';
import { assertTenantLocation } from './service-helpers';

interface PublicMenuQueryInput {
  tenantId: string;
  locationId: string;
  menuId?: string;
}

interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  image: string | null;
  basePrice: number | null;
  itemType: string;
  availability: string;
}

interface PublicMenuCategory {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  items: PublicMenuItem[];
}

interface PublicMenuResult {
  id: string;
  tenantId: string;
  locationId: string;
  name: string;
  description: string | null;
  categories: PublicMenuCategory[];
}

export class PublicMenuQueryService {
  constructor(private readonly menuRepository: MenuRepository) {}

  async getActiveMenus(input: PublicMenuQueryInput): Promise<PublicMenuResult[]> {
    assertTenantLocation(input.tenantId, input.locationId);

    const menus = input.menuId
      ? [
          await this.menuRepository.findById(input.menuId, input.tenantId, input.locationId),
        ].filter((value): value is NonNullable<typeof value> => value !== null)
      : await this.menuRepository.findAllByLocation(input.tenantId, input.locationId);

    return menus
      .map((menu) => this.toPublicMenu(menu.toJSON()))
      .filter((menu): menu is PublicMenuResult => menu !== null);
  }

  private toPublicMenu(snapshot: MenuAggregateSnapshot): PublicMenuResult | null {
    if (snapshot.menu.status !== 'ACTIVE' || snapshot.menu.deletedAt !== null) {
      return null;
    }

    const visibleCategories = snapshot.categories
      .filter((category) => category.status === 'ACTIVE' && category.deletedAt === null)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => {
        const items = snapshot.items
          .filter(
            (item) =>
              item.categoryId === category.id
              && item.status === 'ACTIVE'
              && item.deletedAt === null
              && item.availability === 'AVAILABLE',
          )
          .map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            shortDescription: item.shortDescription,
            image: item.image,
            basePrice: item.basePrice,
            itemType: item.itemType,
            availability: item.availability,
          }));

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          image: category.image,
          sortOrder: category.sortOrder,
          items,
        };
      })
      .filter((category) => category.items.length > 0);

    if (visibleCategories.length === 0) {
      return null;
    }

    return {
      id: snapshot.menu.id,
      tenantId: snapshot.menu.tenantId,
      locationId: snapshot.menu.locationId,
      name: snapshot.menu.name,
      description: snapshot.menu.description,
      categories: visibleCategories,
    };
  }
}
