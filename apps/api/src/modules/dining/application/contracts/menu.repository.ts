import { MenuAggregate } from '../../domain/menu.aggregate';

export interface MenuRepository {
  save(menu: MenuAggregate): Promise<void>;
  update(menu: MenuAggregate): Promise<void>;
  findById(id: string, tenantId: string, locationId: string): Promise<MenuAggregate | null>;
  findAllByLocation(tenantId: string, locationId: string): Promise<MenuAggregate[]>;
  softDelete(id: string, tenantId: string, locationId: string, deletedBy?: string | null): Promise<void>;
}
