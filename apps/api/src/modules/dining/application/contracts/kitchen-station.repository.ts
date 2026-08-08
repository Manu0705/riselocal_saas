import { KitchenStationEntity } from '../../domain/kitchen-station.entity';

export interface KitchenStationRepository {
  save(station: KitchenStationEntity): Promise<void>;
  update(station: KitchenStationEntity): Promise<void>;
  findById(id: string, tenantId: string, locationId: string): Promise<KitchenStationEntity | null>;
  findAllByLocation(tenantId: string, locationId: string): Promise<KitchenStationEntity[]>;
  softDelete(id: string, tenantId: string, locationId: string, deletedBy?: string | null): Promise<void>;
}
