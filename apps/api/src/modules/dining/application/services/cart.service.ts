import crypto from 'node:crypto';
import type { MenuRepository } from '../contracts/menu.repository';
import type { SessionStateGateway } from '../contracts/session-state.gateway';
import type { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import type {
  CartItemRecord,
  CartRecord,
  CartRepository,
} from '../contracts/cart.repository';
import {
  canTransitionCartItemStatus,
  canTransitionCartStatus,
  isActiveCartStatus,
  isDraftCartItemStatus,
  isValidCartQuantity,
  normalizeCartItemStatus,
  normalizeCartStatus,
} from '@saas/domain-core/dining/cart.validation';
import type { CartItemModifier, CartItemStatus, CartStatus } from '@saas/domain-core/dining/cart.contract';
import { isActiveSessionStatus } from '@saas/domain-core/dining/session.validation';

interface ScopedRequest {
  tenantId: string;
  locationId: string;
}

export interface GetActiveCartInput extends ScopedRequest {
  sessionId: string;
}

export interface AddCartItemInput extends GetActiveCartInput {
  menuItemId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string | null;
  modifiers?: CartItemModifier[];
  addedBy?: string | null;
  actorRole?: string | null;
}

export interface UpdateCartItemInput extends ScopedRequest {
  itemId: string;
  quantity: number;
  notes?: string | null;
  modifiers?: CartItemModifier[];
  updatedBy?: string | null;
  actorRole?: string | null;
}

export interface RemoveCartItemInput extends ScopedRequest {
  itemId: string;
  removedBy?: string | null;
  actorRole?: string | null;
}

export interface SubmitCartInput extends GetActiveCartInput {
  submittedBy?: string | null;
  actorRole?: string | null;
}

export interface CartSnapshotResult {
  cart: CartRecord;
  items: CartItemRecord[];
}

function assertScoped(tenantId: string, locationId: string) {
  if (!tenantId || !locationId) {
    throw new Error('tenantId and locationId are required');
  }
}

function normalizeRole(role?: string | null): string {
  return String(role || '').trim().toLowerCase();
}

function isCollaboratorRole(role?: string | null): boolean {
  return ['customer', 'waiter', 'manager', 'owner', 'staff', 'admin', 'super_admin'].includes(normalizeRole(role));
}

function isWaiterRole(role?: string | null): boolean {
  return normalizeRole(role) === 'waiter';
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function checksumFor(cart: CartRecord, items: CartItemRecord[]): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ cart, items }))
    .digest('hex');
}

function toJsonCompatibleModifiers(modifiers?: CartItemModifier[]): unknown {
  return Array.isArray(modifiers)
    ? modifiers.map((modifier) => ({
        id: modifier.id,
        name: modifier.name,
        value: modifier.value ?? null,
      }))
    : [];
}

function assertModifierShape(modifiers?: CartItemModifier[]) {
  if (!Array.isArray(modifiers)) {
    return;
  }

  for (const modifier of modifiers) {
    if (!modifier || typeof modifier.id !== 'string' || !modifier.id.trim()) {
      throw new Error('Invalid modifier id');
    }

    if (!modifier.name || !String(modifier.name).trim()) {
      throw new Error('Invalid modifier name');
    }
  }
}

function isCartEditable(status: CartStatus): boolean {
  return status === 'ACTIVE';
}

export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly menuRepository: MenuRepository,
    private readonly sessionStateGateway: SessionStateGateway,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async getActiveCart(input: GetActiveCartInput): Promise<CartSnapshotResult> {
    assertScoped(input.tenantId, input.locationId);
    await this.assertActiveSession(input.sessionId, input.tenantId, input.locationId);

    const active = await this.cartRepository.findActiveBySession(input.sessionId, input.tenantId, input.locationId);
    if (active) {
      return {
        cart: active,
        items: await this.cartRepository.listItems(active.id, input.tenantId, input.locationId),
      };
    }

    const nextRound = (await this.cartRepository.findActiveCartRound(input.sessionId, input.tenantId, input.locationId)) + 1;
    const created = await this.cartRepository.createCart({
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: input.sessionId,
      roundNumber: nextRound,
      status: 'ACTIVE',
      version: 0,
    });

    await this.eventPublisher.publish({
      type: 'CartCreated',
      payload: {
        cartId: created.id,
        sessionId: created.sessionId,
        tenantId: created.tenantId,
        locationId: created.locationId,
        roundNumber: created.roundNumber,
      },
    });

    return { cart: created, items: [] };
  }

  async addItem(input: AddCartItemInput): Promise<CartSnapshotResult> {
    assertScoped(input.tenantId, input.locationId);

    if (!isCollaboratorRole(input.actorRole)) {
      throw new Error('Permission denied for cart mutations');
    }

    const cart = await this.requireActiveCart(input.sessionId, input.tenantId, input.locationId);
    const quantity = Number(input.quantity);
    if (!isValidCartQuantity(quantity)) {
      throw new Error('quantity must be a positive integer');
    }

    const menuSnapshot = await this.requireMenuItemSnapshot(
      input.tenantId,
      input.locationId,
      input.menuItemId,
      input.variantId,
      input.modifiers,
    );
    assertModifierShape(input.modifiers);

    const unitPrice = this.resolveUnitPrice(menuSnapshot.snapshot, menuSnapshot.item.id, input.variantId);
    const subtotal = unitPrice * quantity;

    const item = await this.cartRepository.createItem({
      tenantId: input.tenantId,
      locationId: input.locationId,
      cartId: cart.id,
      menuItemId: input.menuItemId,
      variantId: input.variantId ?? null,
      quantity,
      notes: input.notes ?? null,
      modifiers: toJsonCompatibleModifiers(input.modifiers),
      unitPrice,
      subtotal,
      addedBy: input.addedBy ?? null,
      status: 'DRAFT',
    });

    await this.recalculateAndSnapshot(cart, input.tenantId, input.locationId, item.addedBy ?? null);

    await this.eventPublisher.publish({
      type: 'CartItemAdded',
      payload: {
        cartId: cart.id,
        itemId: item.id,
        menuItemId: item.menuItemId,
        tenantId: cart.tenantId,
        locationId: cart.locationId,
        addedBy: item.addedBy ?? null,
      },
    });

    if (isWaiterRole(input.actorRole) && item.addedBy) {
      await this.eventPublisher.publish({
        type: 'AssistedItemAdded',
        payload: {
          sessionId: cart.sessionId,
          tenantId: cart.tenantId,
          locationId: cart.locationId,
          cartId: cart.id,
          itemId: item.id,
          waiterId: item.addedBy,
        },
      });
    }

    return this.loadCart(cart.id, input.tenantId, input.locationId);
  }

  async updateItem(input: UpdateCartItemInput): Promise<CartSnapshotResult> {
    assertScoped(input.tenantId, input.locationId);

    if (!isCollaboratorRole(input.actorRole)) {
      throw new Error('Permission denied for cart mutations');
    }

    const item = await this.cartRepository.findItemById(input.itemId, input.tenantId, input.locationId);
    if (!item) {
      throw new Error('Cart item not found');
    }

    const cart = await this.requireEditableCart(item.cartId, input.tenantId, input.locationId);
    if (!isDraftCartItemStatus(normalizeCartItemStatus(item.status))) {
      throw new Error('Cart item is locked');
    }

    const quantity = Number(input.quantity);
    if (quantity < 0 || !Number.isInteger(quantity)) {
      throw new Error('quantity must be a non-negative integer');
    }

    if (quantity === 0) {
      await this.cartRepository.deleteItem(item.id, input.tenantId, input.locationId);
      await this.recalculateAndSnapshot(cart, input.tenantId, input.locationId, input.updatedBy ?? null);
      await this.eventPublisher.publish({
        type: 'CartItemRemoved',
        payload: {
          cartId: cart.id,
          itemId: item.id,
          tenantId: cart.tenantId,
          locationId: cart.locationId,
          removedBy: input.updatedBy ?? null,
        },
      });

      return this.loadCart(cart.id, input.tenantId, input.locationId);
    }

    const menuSnapshot = await this.requireMenuItemSnapshot(
      cart.tenantId,
      cart.locationId,
      item.menuItemId,
      item.variantId ?? undefined,
      input.modifiers,
    );
    assertModifierShape(input.modifiers);
    const unitPrice = this.resolveUnitPrice(menuSnapshot.snapshot, menuSnapshot.item.id, item.variantId ?? undefined);
    const subtotal = unitPrice * quantity;

    const updated = await this.cartRepository.updateItem({
      id: item.id,
      tenantId: input.tenantId,
      locationId: input.locationId,
      expectedVersion: item.version,
      quantity,
      notes: input.notes ?? item.notes ?? null,
      modifiers: input.modifiers ? toJsonCompatibleModifiers(input.modifiers) : item.modifiers,
      unitPrice,
      subtotal,
      updatedBy: input.updatedBy ?? null,
      status: 'DRAFT',
    });

    if (!updated) {
      throw new Error('Cart update conflict');
    }

    await this.recalculateAndSnapshot(cart, input.tenantId, input.locationId, input.updatedBy ?? null);
    await this.eventPublisher.publish({
      type: 'CartItemUpdated',
      payload: {
        cartId: cart.id,
        itemId: item.id,
        tenantId: cart.tenantId,
        locationId: cart.locationId,
        previousQuantity: item.quantity,
        nextQuantity: quantity,
        status: normalizeCartItemStatus(updated.status),
        changedBy: input.updatedBy ?? null,
      },
    });

    return this.loadCart(cart.id, input.tenantId, input.locationId);
  }

  async removeItem(input: RemoveCartItemInput): Promise<CartSnapshotResult> {
    assertScoped(input.tenantId, input.locationId);

    if (!isCollaboratorRole(input.actorRole)) {
      throw new Error('Permission denied for cart mutations');
    }

    const item = await this.cartRepository.findItemById(input.itemId, input.tenantId, input.locationId);
    if (!item) {
      throw new Error('Cart item not found');
    }

    const cart = await this.requireEditableCart(item.cartId, input.tenantId, input.locationId);
    if (!isDraftCartItemStatus(normalizeCartItemStatus(item.status))) {
      throw new Error('Cart item is locked');
    }

    await this.cartRepository.deleteItem(item.id, input.tenantId, input.locationId);
    await this.recalculateAndSnapshot(cart, input.tenantId, input.locationId, input.removedBy ?? null);

    await this.eventPublisher.publish({
      type: 'CartItemRemoved',
      payload: {
        cartId: cart.id,
        itemId: item.id,
        tenantId: cart.tenantId,
        locationId: cart.locationId,
        removedBy: input.removedBy ?? null,
      },
    });

    return this.loadCart(cart.id, input.tenantId, input.locationId);
  }

  async submitCart(input: SubmitCartInput): Promise<{ currentCart: CartSnapshotResult; nextCart: CartSnapshotResult }> {
    assertScoped(input.tenantId, input.locationId);

    if (!isCollaboratorRole(input.actorRole)) {
      throw new Error('Permission denied for cart submission');
    }

    const cart = await this.requireActiveCart(input.sessionId, input.tenantId, input.locationId);
    const items = await this.cartRepository.listItems(cart.id, input.tenantId, input.locationId);
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }

    const nextVersion = cart.version;
    const checksum = checksumFor(cart, items);

    await this.cartRepository.createSnapshot({
      tenantId: cart.tenantId,
      locationId: cart.locationId,
      cartId: cart.id,
      version: cart.version,
      checksum,
    });

    const submitted = await this.cartRepository.updateCart({
      id: cart.id,
      tenantId: cart.tenantId,
      locationId: cart.locationId,
      expectedVersion: cart.version,
      status: 'ARCHIVED',
      subtotal: cart.subtotal,
      total: cart.total,
      updatedBy: input.submittedBy ?? null,
    });

    if (!submitted) {
      throw new Error('Cart update conflict');
    }

    const nextRound = cart.roundNumber + 1;
    const nextCart = await this.cartRepository.createCart({
      tenantId: cart.tenantId,
      locationId: cart.locationId,
      sessionId: cart.sessionId,
      roundNumber: nextRound,
      status: 'ACTIVE',
      version: 0,
      createdBy: input.submittedBy ?? null,
      updatedBy: input.submittedBy ?? null,
    });

    await this.eventPublisher.publish({
      type: 'CartSubmitted',
      payload: {
        cartId: cart.id,
        sessionId: cart.sessionId,
        tenantId: cart.tenantId,
        locationId: cart.locationId,
        previousStatus: 'ACTIVE',
        nextStatus: 'ARCHIVED',
        orderRoundId: null,
        submittedBy: input.submittedBy ?? null,
      },
    });

    await this.eventPublisher.publish({
      type: 'CartCreated',
      payload: {
        cartId: nextCart.id,
        sessionId: nextCart.sessionId,
        tenantId: nextCart.tenantId,
        locationId: nextCart.locationId,
        roundNumber: nextCart.roundNumber,
      },
    });

    return {
      currentCart: await this.loadCart(submitted.id, input.tenantId, input.locationId),
      nextCart: { cart: nextCart, items: [] },
    };
  }

  private async loadCart(cartId: string, tenantId: string, locationId: string): Promise<CartSnapshotResult> {
    const cart = await this.cartRepository.findById(cartId, tenantId, locationId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    return {
      cart,
      items: await this.cartRepository.listItems(cart.id, tenantId, locationId),
    };
  }

  private async requireActiveCart(sessionId: string, tenantId: string, locationId: string): Promise<CartRecord> {
    await this.assertActiveSession(sessionId, tenantId, locationId);
    const active = await this.cartRepository.findActiveBySession(sessionId, tenantId, locationId);
    if (active) {
      return active;
    }

    const roundNumber = (await this.cartRepository.findActiveCartRound(sessionId, tenantId, locationId)) + 1;
    const created = await this.cartRepository.createCart({
      tenantId,
      locationId,
      sessionId,
      roundNumber,
      status: 'ACTIVE',
      version: 0,
    });

    await this.eventPublisher.publish({
      type: 'CartCreated',
      payload: {
        cartId: created.id,
        sessionId: created.sessionId,
        tenantId: created.tenantId,
        locationId: created.locationId,
        roundNumber: created.roundNumber,
      },
    });

    return created;
  }

  private async requireEditableCart(cartId: string, tenantId: string, locationId: string): Promise<CartRecord> {
    const cart = await this.cartRepository.findById(cartId, tenantId, locationId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    if (!isActiveCartStatus(normalizeCartStatus(cart.status))) {
      throw new Error('Cart is not editable');
    }

    return cart;
  }

  private async assertActiveSession(sessionId: string, tenantId: string, locationId: string) {
    const state = await this.sessionStateGateway.getSessionState(sessionId, tenantId, locationId);
    if (!state.exists) {
      throw new Error('Dining session not found');
    }

    if (!isActiveSessionStatus(state.status)) {
      throw new Error('Session is closed or archived');
    }
  }

  private async requireMenuItemSnapshot(
    tenantId: string,
    locationId: string,
    menuItemId: string,
    variantId?: string | null,
    modifiers?: CartItemModifier[],
  ) {
    const menu = await this.menuRepository.findAllByLocation(tenantId, locationId);
    for (const aggregate of menu) {
      const snapshot = aggregate.toJSON();
      const item = snapshot.items.find((entry) => entry.id === menuItemId);
      if (!item) {
        continue;
      }

      if (item.status !== 'ACTIVE' || item.deletedAt !== null || item.availability !== 'AVAILABLE') {
        throw new Error('Menu item is unavailable');
      }

      if (variantId) {
        const variant = snapshot.variants.find((entry) => entry.id === variantId && entry.itemId === menuItemId);
        if (!variant || variant.deletedAt !== null || variant.status !== 'ACTIVE') {
          throw new Error('Variant not found');
        }
      }

      if (Array.isArray(modifiers) && modifiers.length > 0) {
        for (const modifier of modifiers) {
          const hasModifier = snapshot.modifiers.some((entry) => entry.id === modifier.id && entry.itemId === menuItemId);
          if (!hasModifier) {
            throw new Error(`Modifier not found: ${modifier.id}`);
          }
        }
      }

      return { snapshot, item };
    }

    throw new Error('Menu item not found');
  }

  private resolveUnitPrice(snapshot: any, itemId: string, variantId?: string | null): number {
    const menuItem = snapshot.items.find((entry: any) => entry.id === itemId);
    const variant = variantId ? snapshot.variants.find((entry: any) => entry.id === variantId && entry.itemId === itemId) : null;
    const pricing = snapshot.prices.find((entry: any) => entry.itemId === itemId && (!variantId || entry.variantId === variantId));

    if (pricing?.amount !== null && pricing?.amount !== undefined) {
      return Number(pricing.amount);
    }

    const basePrice = menuItem?.basePrice ?? 0;
    const variantAdjustment = variant?.priceAdjustment ?? 0;
    return Number(basePrice) + Number(variantAdjustment);
  }

  private async recalculateAndSnapshot(cart: CartRecord, tenantId: string, locationId: string, updatedBy: string | null) {
    const items = await this.cartRepository.listItems(cart.id, tenantId, locationId);
    const subtotal = sum(items.map((item) => item.subtotal));

    const updated = await this.cartRepository.updateCart({
      id: cart.id,
      tenantId,
      locationId,
      expectedVersion: cart.version,
      subtotal,
      total: subtotal,
      updatedBy,
    });

    if (!updated) {
      throw new Error('Cart update conflict');
    }

    await this.cartRepository.createSnapshot({
      tenantId,
      locationId,
      cartId: cart.id,
      version: updated.version,
      checksum: checksumFor(updated, items),
    });
  }
}