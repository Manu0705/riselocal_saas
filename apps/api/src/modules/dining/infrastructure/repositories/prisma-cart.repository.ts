import { prisma } from '@saas/database';
import type {
  CartCreateInput,
  CartItemCreateInput,
  CartItemRecord,
  CartItemUpdateInput,
  CartRecord,
  CartRepository,
  CartSnapshotCreateInput,
  CartSnapshotRecord,
  CartUpdateInput,
} from '../../application/contracts/cart.repository';

type CartDelegate = {
  create(args: unknown): Promise<any>;
  updateMany(args: unknown): Promise<any>;
  findFirst(args: unknown): Promise<any | null>;
  findMany(args: unknown): Promise<any[]>;
};

type DiningCartDelegates = {
  diningCart: CartDelegate;
  diningCartItem: CartDelegate;
  diningCartSnapshot: CartDelegate;
};

function delegates(client: unknown): DiningCartDelegates {
  return client as DiningCartDelegates;
}

export class PrismaCartRepository implements CartRepository {
  async findActiveBySession(sessionId: string, tenantId: string, locationId: string): Promise<CartRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningCart.findFirst({
      where: { sessionId, tenantId, locationId, status: 'ACTIVE', deletedAt: null },
      orderBy: { roundNumber: 'desc' },
    });
    return record ? this.mapCart(record) : null;
  }

  async findById(id: string, tenantId: string, locationId: string): Promise<CartRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningCart.findFirst({
      where: { id, tenantId, locationId, deletedAt: null },
    });
    return record ? this.mapCart(record) : null;
  }

  async findBySessionAndRound(sessionId: string, roundNumber: number, tenantId: string, locationId: string): Promise<CartRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningCart.findFirst({
      where: { sessionId, roundNumber, tenantId, locationId, deletedAt: null },
    });
    return record ? this.mapCart(record) : null;
  }

  async createCart(input: CartCreateInput): Promise<CartRecord> {
    const db = delegates(prisma);
    const record = await db.diningCart.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        sessionId: input.sessionId,
        roundNumber: input.roundNumber,
        status: input.status ?? 'ACTIVE',
        subtotal: 0,
        total: 0,
        version: input.version ?? 0,
        createdBy: input.createdBy ?? null,
        updatedBy: input.updatedBy ?? null,
      },
    });

    return this.mapCart(record);
  }

  async updateCart(input: CartUpdateInput): Promise<CartRecord | null> {
    const now = new Date();
    const db = delegates(prisma);
    const result = await db.diningCart.updateMany({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        locationId: input.locationId,
        deletedAt: null,
        version: input.expectedVersion,
      },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.subtotal !== undefined ? { subtotal: input.subtotal } : {}),
        ...(input.total !== undefined ? { total: input.total } : {}),
        updatedBy: input.updatedBy ?? null,
        updatedAt: now,
        version: { increment: 1 },
      },
    });

    if (!result || result.count === 0) {
      return null;
    }

    const record = await db.diningCart.findFirst({
      where: { id: input.id, tenantId: input.tenantId, locationId: input.locationId, deletedAt: null },
    });
    return record ? this.mapCart(record) : null;
  }

  async listItems(cartId: string, tenantId: string, locationId: string): Promise<CartItemRecord[]> {
    const db = delegates(prisma);
    const records = await db.diningCartItem.findMany({
      where: { cartId, tenantId, locationId, deletedAt: null },
      orderBy: { addedAt: 'asc' },
    });

    return records.map((record: unknown) => this.mapItem(record));
  }

  async findItemById(id: string, tenantId: string, locationId: string): Promise<CartItemRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningCartItem.findFirst({
      where: { id, tenantId, locationId, deletedAt: null },
    });
    return record ? this.mapItem(record) : null;
  }

  async createItem(input: CartItemCreateInput): Promise<CartItemRecord> {
    const db = delegates(prisma);
    const created = await db.diningCartItem.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        cartId: input.cartId,
        menuItemId: input.menuItemId,
        variantId: input.variantId ?? null,
        quantity: input.quantity,
        notes: input.notes ?? null,
        modifiers: input.modifiers ?? [],
        unitPrice: input.unitPrice,
        subtotal: input.subtotal,
        addedBy: input.addedBy ?? null,
        updatedBy: input.addedBy ?? null,
        status: input.status ?? 'DRAFT',
      },
    });

    return this.mapItem(created);
  }

  async updateItem(input: CartItemUpdateInput): Promise<CartItemRecord | null> {
    const now = new Date();
    const db = delegates(prisma);
    const result = await db.diningCartItem.updateMany({
      where: { id: input.id, tenantId: input.tenantId, locationId: input.locationId, deletedAt: null, version: input.expectedVersion },
      data: {
        quantity: input.quantity,
        notes: input.notes ?? null,
        modifiers: input.modifiers ?? [],
        unitPrice: input.unitPrice,
        subtotal: input.subtotal,
        ...(input.status ? { status: input.status } : {}),
        updatedBy: input.updatedBy ?? null,
        updatedAt: now,
        version: { increment: 1 },
      },
    });

    if (!result || result.count === 0) {
      return null;
    }

    const record = await db.diningCartItem.findFirst({
      where: { id: input.id, tenantId: input.tenantId, locationId: input.locationId, deletedAt: null },
    });
    return record ? this.mapItem(record) : null;
  }

  async deleteItem(id: string, tenantId: string, locationId: string): Promise<CartItemRecord | null> {
    const db = delegates(prisma);
    const record = await db.diningCartItem.findFirst({
      where: { id, tenantId, locationId, deletedAt: null },
    });
    if (!record) {
      return null;
    }

    await db.diningCartItem.updateMany({
      where: { id, tenantId, locationId, deletedAt: null },
      data: {
        status: 'REMOVED',
        deletedAt: new Date(),
        updatedAt: new Date(),
        version: { increment: 1 },
      },
    });

    return this.mapItem(record);
  }

  async createSnapshot(input: CartSnapshotCreateInput): Promise<CartSnapshotRecord> {
    const db = delegates(prisma);
    const record = await db.diningCartSnapshot.create({
      data: {
        tenantId: input.tenantId,
        locationId: input.locationId,
        cartId: input.cartId,
        version: input.version,
        checksum: input.checksum,
      },
    });
    return this.mapSnapshot(record);
  }

  async listSnapshots(cartId: string, tenantId: string, locationId: string): Promise<CartSnapshotRecord[]> {
    const db = delegates(prisma);
    const records = await db.diningCartSnapshot.findMany({
      where: { cartId, tenantId, locationId },
      orderBy: { version: 'asc' },
    });
    return records.map((record: unknown) => this.mapSnapshot(record));
  }

  async findActiveCartRound(sessionId: string, tenantId: string, locationId: string): Promise<number> {
    const db = delegates(prisma);
    const record = await db.diningCart.findFirst({
      where: { sessionId, tenantId, locationId },
      orderBy: { roundNumber: 'desc' },
      select: { roundNumber: true },
    });
    return record ? Number(record.roundNumber) : 0;
  }

  private mapCart(record: any): CartRecord {
    return {
      ...record,
      subtotal: Number(record.subtotal ?? 0),
      total: Number(record.total ?? 0),
      version: Number(record.version ?? 0),
    };
  }

  private mapItem(record: any): CartItemRecord {
    return {
      ...record,
      quantity: Number(record.quantity ?? 0),
      unitPrice: Number(record.unitPrice ?? 0),
      subtotal: Number(record.subtotal ?? 0),
      version: Number(record.version ?? 0),
    };
  }

  private mapSnapshot(record: any): CartSnapshotRecord {
    return {
      ...record,
      version: Number(record.version ?? 0),
    };
  }
}