import { MenuAggregate } from '../../domain/menu.aggregate';
import { MenuRepository } from '../contracts/menu.repository';
import { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import { assertTenantLocation, cloneSnapshot, loadMenuOrThrow, rebuild } from './service-helpers';

interface CreateMenuInput {
  tenantId: string;
  locationId: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  createdBy?: string | null;
}

interface UpdateMenuInput {
  menuId: string;
  tenantId: string;
  locationId: string;
  name?: string;
  description?: string | null;
  sortOrder?: number;
  updatedBy?: string | null;
}

interface ArchiveMenuInput {
  menuId: string;
  tenantId: string;
  locationId: string;
  archivedBy?: string | null;
}

export class MenuService {
  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async createMenu(input: CreateMenuInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const menu = MenuAggregate.create({
      tenantId: input.tenantId,
      locationId: input.locationId,
      name: input.name,
      description: input.description ?? null,
      sortOrder: input.sortOrder,
      createdBy: input.createdBy,
    });

    await this.menuRepository.save(menu);

    await this.eventPublisher.publish({
      type: 'MenuCreated',
      payload: {
        menuId: menu.id,
        tenantId: menu.tenantId,
        locationId: menu.locationId,
      },
    });

    return menu.toJSON();
  }

  async updateMenu(input: UpdateMenuInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const menu = await loadMenuOrThrow(
      this.menuRepository,
      input.menuId,
      input.tenantId,
      input.locationId,
    );

    if (input.name !== undefined) {
      menu.rename(input.name, input.updatedBy);
    }

    if (input.description !== undefined || input.sortOrder !== undefined) {
      const changed = cloneSnapshot(menu.toJSON());
      if (input.description !== undefined) {
        changed.menu.description = input.description;
      }
      if (input.sortOrder !== undefined) {
        changed.menu.sortOrder = input.sortOrder;
      }
      changed.menu.updatedBy = input.updatedBy ?? changed.menu.updatedBy;
      changed.menu.updatedAt = new Date();
      changed.menu.version += 1;
      const rebuilt = rebuild(changed);
      await this.menuRepository.update(rebuilt);

      await this.eventPublisher.publish({
        type: 'MenuUpdated',
        payload: {
          menuId: rebuilt.id,
          tenantId: rebuilt.tenantId,
          locationId: rebuilt.locationId,
        },
      });

      return rebuilt.toJSON();
    }

    await this.menuRepository.update(menu);

    await this.eventPublisher.publish({
      type: 'MenuUpdated',
      payload: {
        menuId: menu.id,
        tenantId: menu.tenantId,
        locationId: menu.locationId,
      },
    });

    return menu.toJSON();
  }

  async archiveMenu(input: ArchiveMenuInput): Promise<void> {
    assertTenantLocation(input.tenantId, input.locationId);

    const menu = await loadMenuOrThrow(
      this.menuRepository,
      input.menuId,
      input.tenantId,
      input.locationId,
    );

    menu.archive(input.archivedBy);

    await this.menuRepository.softDelete(
      input.menuId,
      input.tenantId,
      input.locationId,
      input.archivedBy,
    );

    await this.eventPublisher.publish({
      type: 'MenuUpdated',
      payload: {
        menuId: menu.id,
        tenantId: menu.tenantId,
        locationId: menu.locationId,
      },
    });
  }
}
