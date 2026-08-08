import type { AvailabilityStatus } from '@saas/domain-core/dining/menu.contract';
import { AvailabilityEntity } from '../../domain/availability.entity';
import { ItemEntity } from '../../domain/item.entity';
import { MenuRepository } from '../contracts/menu.repository';
import { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import { assertTenantLocation, cloneSnapshot, loadMenuOrThrow, rebuild } from './service-helpers';

interface SetAvailabilityInput {
  menuId: string;
  itemId: string;
  tenantId: string;
  locationId: string;
  status: AvailabilityStatus;
  reason?: string | null;
  changedBy?: string | null;
}

export class AvailabilityService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async setAvailability(input: SetAvailabilityInput) {
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
    const oldStatus = snapshot.items[itemIndex].availability;

    if (snapshot.items[itemIndex].status === 'ARCHIVED') {
      throw new Error('Cannot change availability for archived item');
    }

    item.setAvailability(input.status, input.changedBy);
    snapshot.items[itemIndex] = item.toJSON();

    const availabilityIndex = snapshot.availabilities.findIndex(
      (entry) => entry.itemId === input.itemId && entry.deletedAt === null,
    );

    if (availabilityIndex >= 0) {
      const availability = AvailabilityEntity.fromPersistence(snapshot.availabilities[availabilityIndex]);
      availability.transitionTo(input.status, input.reason, input.changedBy);
      snapshot.availabilities[availabilityIndex] = availability.toJSON();
    } else {
      const availability = AvailabilityEntity.create({
        tenantId: input.tenantId,
        locationId: input.locationId,
        itemId: input.itemId,
        status: input.status,
        reason: input.reason,
        updatedBy: input.changedBy,
      });
      snapshot.availabilities.push(availability.toJSON());
    }

    snapshot.menu.updatedBy = input.changedBy ?? snapshot.menu.updatedBy;
    snapshot.menu.updatedAt = new Date();
    snapshot.menu.version += 1;

    await this.menuRepository.update(rebuild(snapshot));

    await this.eventPublisher.publish({
      type: 'ItemAvailabilityChanged',
      payload: {
        itemId: input.itemId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        oldStatus,
        newStatus: input.status,
        changedBy: input.changedBy,
      },
    });
  }
}
