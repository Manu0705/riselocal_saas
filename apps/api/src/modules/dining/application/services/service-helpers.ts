import { MenuAggregate, type MenuAggregateSnapshot } from '../../domain/menu.aggregate';
import { MenuRepository } from '../contracts/menu.repository';

export async function loadMenuOrThrow(
  menuRepository: MenuRepository,
  menuId: string,
  tenantId: string,
  locationId: string,
): Promise<MenuAggregate> {
  if (!menuId) {
    throw new Error('menuId is required');
  }

  const menu = await menuRepository.findById(menuId, tenantId, locationId);
  if (!menu) {
    throw new Error('Menu not found');
  }

  return menu;
}

export function cloneSnapshot(snapshot: MenuAggregateSnapshot): MenuAggregateSnapshot {
  return {
    menu: { ...snapshot.menu },
    categories: snapshot.categories.map((category) => ({ ...category })),
    items: snapshot.items.map((item) => ({ ...item })),
    variants: snapshot.variants.map((variant) => ({ ...variant })),
    addons: snapshot.addons.map((addon) => ({ ...addon })),
    modifiers: snapshot.modifiers.map((modifier) => ({ ...modifier })),
    prices: snapshot.prices.map((price) => ({ ...price })),
    availabilities: snapshot.availabilities.map((availability) => ({ ...availability })),
  };
}

export function rebuild(snapshot: MenuAggregateSnapshot): MenuAggregate {
  return MenuAggregate.fromPersistence(snapshot);
}

export function assertTenantLocation(tenantId: string, locationId: string): void {
  if (!tenantId) {
    throw new Error('tenantId is required');
  }

  if (!locationId) {
    throw new Error('locationId is required');
  }
}
