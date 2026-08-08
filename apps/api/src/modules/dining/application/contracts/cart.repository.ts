import type { Cart, CartItem, CartItemStatus, CartSnapshot, CartStatus } from '@saas/domain-core/dining/cart.contract';

export interface CartRecord extends Omit<Cart, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

export interface CartItemRecord extends Omit<CartItem, 'addedAt' | 'updatedAt'> {
  addedAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  version: number;
}

export interface CartSnapshotRecord extends Omit<CartSnapshot, 'createdAt'> {
  createdAt: Date;
}

export interface CartCreateInput {
  tenantId: string;
  locationId: string;
  sessionId: string;
  roundNumber: number;
  status?: CartStatus;
  version?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface CartUpdateInput {
  id: string;
  tenantId: string;
  locationId: string;
  expectedVersion: number;
  status?: CartStatus;
  subtotal?: number;
  total?: number;
  updatedBy?: string | null;
}

export interface CartItemCreateInput {
  tenantId: string;
  locationId: string;
  cartId: string;
  menuItemId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string | null;
  modifiers?: unknown;
  unitPrice: number;
  subtotal: number;
  addedBy?: string | null;
  status?: CartItemStatus;
}

export interface CartItemUpdateInput {
  id: string;
  tenantId: string;
  locationId: string;
  expectedVersion: number;
  quantity: number;
  notes?: string | null;
  modifiers?: unknown;
  unitPrice: number;
  subtotal: number;
  updatedBy?: string | null;
  status?: CartItemStatus;
}

export interface CartSnapshotCreateInput {
  tenantId: string;
  locationId: string;
  cartId: string;
  version: number;
  checksum: string;
}

export interface CartRepository {
  findActiveBySession(sessionId: string, tenantId: string, locationId: string): Promise<CartRecord | null>;
  findById(id: string, tenantId: string, locationId: string): Promise<CartRecord | null>;
  findBySessionAndRound(
    sessionId: string,
    roundNumber: number,
    tenantId: string,
    locationId: string,
  ): Promise<CartRecord | null>;
  createCart(input: CartCreateInput): Promise<CartRecord>;
  updateCart(input: CartUpdateInput): Promise<CartRecord | null>;
  listItems(cartId: string, tenantId: string, locationId: string): Promise<CartItemRecord[]>;
  findItemById(id: string, tenantId: string, locationId: string): Promise<CartItemRecord | null>;
  createItem(input: CartItemCreateInput): Promise<CartItemRecord>;
  updateItem(input: CartItemUpdateInput): Promise<CartItemRecord | null>;
  deleteItem(id: string, tenantId: string, locationId: string): Promise<CartItemRecord | null>;
  createSnapshot(input: CartSnapshotCreateInput): Promise<CartSnapshotRecord>;
  listSnapshots(cartId: string, tenantId: string, locationId: string): Promise<CartSnapshotRecord[]>;
  findActiveCartRound(sessionId: string, tenantId: string, locationId: string): Promise<number>;
}