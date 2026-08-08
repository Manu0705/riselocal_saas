import { ItemEntity } from '../../domain/item.entity';
import { KitchenStationRepository } from '../contracts/kitchen-station.repository';
import { MenuRepository } from '../contracts/menu.repository';
import { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import { assertTenantLocation, cloneSnapshot, loadMenuOrThrow, rebuild } from './service-helpers';

interface AssignKitchenStationInput {
  menuId: string;
  itemId: string;
  kitchenStationId: string | null;
  tenantId: string;
  locationId: string;
  assignedBy?: string | null;
}

interface KitchenStationLoadInput {
  tenantId: string;
  locationId: string;
}

export class KitchenRoutingService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly kitchenStationRepository: KitchenStationRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async assignKitchenStation(input: AssignKitchenStationInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    if (input.kitchenStationId) {
      const station = await this.kitchenStationRepository.findById(
        input.kitchenStationId,
        input.tenantId,
        input.locationId,
      );

      if (!station) {
        throw new Error('Kitchen station not found');
      }

      if (station.toJSON().status !== 'ACTIVE') {
        throw new Error('Kitchen station must be active');
      }
    }

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

    if (item.toJSON().status === 'ARCHIVED') {
      throw new Error('Cannot assign kitchen station to archived item');
    }

    item.assignKitchenStation(input.kitchenStationId, input.assignedBy);
    snapshot.items[itemIndex] = item.toJSON();
    snapshot.menu.updatedBy = input.assignedBy ?? snapshot.menu.updatedBy;
    snapshot.menu.updatedAt = new Date();
    snapshot.menu.version += 1;

    await this.menuRepository.update(rebuild(snapshot));

    await this.eventPublisher.publish({
      type: 'KitchenStationAssigned',
      payload: {
        itemId: input.itemId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        kitchenStationId: input.kitchenStationId,
        assignedBy: input.assignedBy,
      },
    });
  }

  async listKitchenStations(input: KitchenStationLoadInput) {
    assertTenantLocation(input.tenantId, input.locationId);
    return this.kitchenStationRepository.findAllByLocation(input.tenantId, input.locationId);
  }
}
