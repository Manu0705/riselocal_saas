import { prisma } from '@saas/database';
import { KitchenStationEntity } from '../../domain/kitchen-station.entity';
import { KitchenStationRepository } from '../../application/contracts/kitchen-station.repository';

type KitchenStationDelegate = {
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  findFirst(args: unknown): Promise<any | null>;
  findMany(args: unknown): Promise<any[]>;
  updateMany(args: unknown): Promise<unknown>;
};

function stationDelegate(): KitchenStationDelegate {
  return (prisma as unknown as Record<string, unknown>)['kitchenStation'] as KitchenStationDelegate;
}

export class PrismaKitchenStationRepository implements KitchenStationRepository {
  async save(station: KitchenStationEntity): Promise<void> {
    const data = station.toJSON();
    const delegate = stationDelegate();

    await delegate.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        locationId: data.locationId,
        name: data.name,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
        version: data.version,
        deletedAt: data.deletedAt,
      },
    });
  }

  async update(station: KitchenStationEntity): Promise<void> {
    const data = station.toJSON();
    const delegate = stationDelegate();

    await delegate.update({
      where: {
        id: data.id,
        tenantId: data.tenantId,
        locationId: data.locationId,
      },
      data: {
        name: data.name,
        status: data.status,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
        version: data.version,
        deletedAt: data.deletedAt,
      },
    });
  }

  async findById(id: string, tenantId: string, locationId: string): Promise<KitchenStationEntity | null> {
    const delegate = stationDelegate();

    const record = await delegate.findFirst({
      where: {
        id,
        tenantId,
        locationId,
        deletedAt: null,
      },
    });

    if (!record) {
      return null;
    }

    return KitchenStationEntity.fromPersistence({
      id: record.id,
      tenantId: record.tenantId,
      locationId: record.locationId,
      name: record.name,
      status: record.status as 'ACTIVE' | 'INACTIVE',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      version: record.version,
      deletedAt: record.deletedAt,
    });
  }

  async findAllByLocation(tenantId: string, locationId: string): Promise<KitchenStationEntity[]> {
    const delegate = stationDelegate();

    const records = await delegate.findMany({
      where: {
        tenantId,
        locationId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    return records.map((record: any) =>
      KitchenStationEntity.fromPersistence({
        id: record.id,
        tenantId: record.tenantId,
        locationId: record.locationId,
        name: record.name,
        status: record.status as 'ACTIVE' | 'INACTIVE',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        createdBy: record.createdBy,
        updatedBy: record.updatedBy,
        version: record.version,
        deletedAt: record.deletedAt,
      }),
    );
  }

  async softDelete(
    id: string,
    tenantId: string,
    locationId: string,
    deletedBy?: string | null,
  ): Promise<void> {
    const delegate = stationDelegate();

    await delegate.updateMany({
      where: { id, tenantId, locationId, deletedAt: null },
      data: {
        status: 'INACTIVE',
        updatedBy: deletedBy ?? null,
        updatedAt: new Date(),
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });
  }
}
