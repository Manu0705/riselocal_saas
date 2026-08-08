import crypto from 'node:crypto';
import type { MenuRepository } from '../contracts/menu.repository';
import type { SessionStateGateway } from '../contracts/session-state.gateway';
import type { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import type {
  CartItemRecord,
  CartRecord,
  CartRepository,
} from '../contracts/cart.repository';
import type {
  DiningOrderRecord,
  OrderRoundRecord,
  OrderRoundRepository,
} from '../contracts/order-round.repository';
import {
  canTransitionOrderRoundStatus,
  isClosedOrderRoundStatus,
  isDraftOrderRoundStatus,
  normalizeOrderRoundStatus,
} from '@saas/domain-core/dining/order-round.validation';
import { isActiveSessionStatus } from '@saas/domain-core/dining/session.validation';

interface ScopedRequest {
  tenantId: string;
  locationId: string;
}

interface SessionScopedRequest extends ScopedRequest {
  sessionId: string;
}

export interface CreateRoundInput extends SessionScopedRequest {
  actorId?: string | null;
  actorRole?: string | null;
}

export interface SubmitRoundInput extends ScopedRequest {
  roundId: string;
  actorId?: string | null;
  actorRole?: string | null;
  idempotencyKey?: string | null;
}

export interface SessionOrdersInput extends SessionScopedRequest {
  actorRole?: string | null;
}

export interface CancelRoundInput extends ScopedRequest {
  roundId: string;
  actorId?: string | null;
  actorRole?: string | null;
}

export interface RoundCreationResult {
  round: OrderRoundRecord;
  cart: CartRecord;
}

export interface RoundSubmissionResult {
  round: OrderRoundRecord;
  order: DiningOrderRecord;
  archivedCart: CartRecord;
  nextCart: CartRecord;
  kitchenTicketIds: string[];
  billingReferenceId: string | null;
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

function isManagerRole(role?: string | null): boolean {
  return ['manager', 'owner', 'admin', 'super_admin'].includes(normalizeRole(role));
}

function isStaffSubmissionRole(role?: string | null): boolean {
  return ['waiter', 'manager', 'owner', 'staff', 'admin', 'super_admin', 'cashier'].includes(normalizeRole(role));
}

function checksumFor(cart: CartRecord, items: CartItemRecord[]): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ cart, items }))
    .digest('hex');
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export class OrderRoundService {
  constructor(
    private readonly orderRoundRepository: OrderRoundRepository,
    private readonly cartRepository: CartRepository,
    private readonly menuRepository: MenuRepository,
    private readonly sessionStateGateway: SessionStateGateway,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async createRound(input: CreateRoundInput): Promise<RoundCreationResult> {
    assertScoped(input.tenantId, input.locationId);

    if (!isCollaboratorRole(input.actorRole)) {
      throw new Error('Permission denied for round creation');
    }

    await this.assertSessionActive(input.sessionId, input.tenantId, input.locationId);

    const draft = await this.orderRoundRepository.findDraftBySession(input.sessionId, input.tenantId, input.locationId);
    if (draft) {
      const existingCart = await this.resolveRoundCart(draft, input.tenantId, input.locationId);
      if (!existingCart) {
        throw new Error('Draft round cart not found');
      }

      return {
        round: draft,
        cart: existingCart,
      };
    }

    const maxRoundNumber = await this.orderRoundRepository.findMaxRoundNumber(
      input.sessionId,
      input.tenantId,
      input.locationId,
    );

    const activeCart = await this.cartRepository.findActiveBySession(input.sessionId, input.tenantId, input.locationId);
    const nextRoundNumber = maxRoundNumber + 1;

    const draftCart = activeCart
      ? activeCart
      : await this.cartRepository.createCart({
          tenantId: input.tenantId,
          locationId: input.locationId,
          sessionId: input.sessionId,
          roundNumber: nextRoundNumber,
          status: 'ACTIVE',
          version: 0,
          createdBy: input.actorId ?? null,
          updatedBy: input.actorId ?? null,
        });

    const roundNumber = activeCart ? activeCart.roundNumber : nextRoundNumber;
    if (roundNumber < nextRoundNumber) {
      throw new Error('Round numbering conflict detected');
    }

    const createdRound = await this.orderRoundRepository.createRound({
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: input.sessionId,
      draftCartId: draftCart.id,
      roundNumber,
      status: 'DRAFT',
      createdBy: input.actorId ?? null,
    });

    await this.eventPublisher.publish({
      type: 'OrderRoundCreated',
      payload: {
        roundId: createdRound.id,
        sessionId: createdRound.sessionId,
        tenantId: createdRound.tenantId,
        locationId: createdRound.locationId,
        roundNumber: createdRound.roundNumber,
        cartId: draftCart.id,
      },
    });

    return {
      round: createdRound,
      cart: draftCart,
    };
  }

  async submitRound(input: SubmitRoundInput): Promise<RoundSubmissionResult> {
    assertScoped(input.tenantId, input.locationId);

    if (!isCollaboratorRole(input.actorRole)) {
      throw new Error('Permission denied for round submission');
    }

    const round = await this.orderRoundRepository.findById(input.roundId, input.tenantId, input.locationId);
    if (!round) {
      throw new Error('Order round not found');
    }

    await this.assertSessionActive(round.sessionId, round.tenantId, round.locationId);

    if (isClosedOrderRoundStatus(normalizeOrderRoundStatus(round.status))) {
      throw new Error('Round is already closed');
    }

    if (!isDraftOrderRoundStatus(normalizeOrderRoundStatus(round.status))) {
      const existingOrder = await this.orderRoundRepository.findOrderByRound(round.id, round.tenantId, round.locationId);
      if (input.idempotencyKey && round.idempotencyKey && round.idempotencyKey === input.idempotencyKey && existingOrder) {
        const archivedCart = await this.resolveRoundCart(round, input.tenantId, input.locationId);
        const nextCart =
          (await this.cartRepository.findActiveBySession(round.sessionId, input.tenantId, input.locationId)) ||
          (await this.cartRepository.createCart({
            tenantId: input.tenantId,
            locationId: input.locationId,
            sessionId: round.sessionId,
            roundNumber: round.roundNumber + 1,
            status: 'ACTIVE',
            version: 0,
            createdBy: input.actorId ?? null,
            updatedBy: input.actorId ?? null,
          }));

        return {
          round,
          order: existingOrder,
          archivedCart: archivedCart ?? nextCart,
          nextCart,
          kitchenTicketIds: [],
          billingReferenceId: null,
        };
      }

      throw new Error('Round already submitted');
    }

    const cart = await this.resolveRoundCart(round, input.tenantId, input.locationId);
    if (!cart) {
      throw new Error('Round cart not found');
    }

    if (cart.status !== 'ACTIVE') {
      throw new Error('Round cart is not active');
    }

    const cartItems = await this.cartRepository.listItems(cart.id, input.tenantId, input.locationId);
    if (cartItems.length === 0) {
      throw new Error('Round cart is empty');
    }

    const menuIndex = await this.buildMenuIndex(input.tenantId, input.locationId);
    const validatedItems = cartItems.map((item) => this.snapshotOrderItemFromCart(item, menuIndex));
    const totalAmount = sum(validatedItems.map((item) => item.subtotal));

    const submittedRound = await this.orderRoundRepository.updateRound({
      id: round.id,
      tenantId: round.tenantId,
      locationId: round.locationId,
      expectedVersion: round.version,
      status: 'SUBMITTED',
      submittedBy: input.actorId ?? null,
      submittedAt: new Date(),
      idempotencyKey: input.idempotencyKey ?? null,
      updatedBy: input.actorId ?? null,
    });

    if (!submittedRound) {
      throw new Error('Round update conflict');
    }

    const createdOrder = await this.orderRoundRepository.createOrder({
      tenantId: round.tenantId,
      locationId: round.locationId,
      roundId: round.id,
      sessionId: round.sessionId,
      status: 'SUBMITTED',
      totalAmount,
      submittedAt: new Date(),
      createdBy: input.actorId ?? null,
    });

    await this.orderRoundRepository.createOrderItems(
      validatedItems.map((item) => ({
        tenantId: round.tenantId,
        locationId: round.locationId,
        orderId: createdOrder.id,
        menuItemId: item.menuItemId,
        itemSnapshot: item.itemSnapshot,
        priceSnapshot: item.priceSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        kitchenStatus: 'PENDING',
        createdBy: input.actorId ?? null,
      })),
    );

    await this.lockCartItems(cartItems, input.tenantId, input.locationId, input.actorId ?? null);

    await this.cartRepository.createSnapshot({
      tenantId: round.tenantId,
      locationId: round.locationId,
      cartId: cart.id,
      version: cart.version,
      checksum: checksumFor(cart, cartItems),
    });

    const archivedCart = await this.cartRepository.updateCart({
      id: cart.id,
      tenantId: cart.tenantId,
      locationId: cart.locationId,
      expectedVersion: cart.version,
      status: 'ARCHIVED',
      subtotal: cart.subtotal,
      total: cart.total,
      updatedBy: input.actorId ?? null,
    });

    if (!archivedCart) {
      throw new Error('Cart archive conflict');
    }

    const nextCart = await this.cartRepository.createCart({
      tenantId: round.tenantId,
      locationId: round.locationId,
      sessionId: round.sessionId,
      roundNumber: round.roundNumber + 1,
      status: 'ACTIVE',
      version: 0,
      createdBy: input.actorId ?? null,
      updatedBy: input.actorId ?? null,
    });

    await this.eventPublisher.publish({
      type: 'CartSubmitted',
      payload: {
        cartId: cart.id,
        sessionId: round.sessionId,
        tenantId: round.tenantId,
        locationId: round.locationId,
        previousStatus: 'ACTIVE',
        nextStatus: 'ARCHIVED',
        orderRoundId: round.id,
        submittedBy: input.actorId ?? null,
      },
    });

    await this.eventPublisher.publish({
      type: 'OrderRoundSubmitted',
      payload: {
        roundId: submittedRound.id,
        sessionId: submittedRound.sessionId,
        tenantId: submittedRound.tenantId,
        locationId: submittedRound.locationId,
        previousStatus: 'DRAFT',
        nextStatus: 'SUBMITTED',
        submittedBy: input.actorId ?? null,
        orderId: createdOrder.id,
      },
    });

    await this.eventPublisher.publish({
      type: 'OrderCreated',
      payload: {
        orderId: createdOrder.id,
        roundId: submittedRound.id,
        sessionId: submittedRound.sessionId,
        tenantId: submittedRound.tenantId,
        locationId: submittedRound.locationId,
        status: createdOrder.status,
        totalAmount: createdOrder.totalAmount,
      },
    });

    if (input.actorId && isStaffSubmissionRole(input.actorRole) && normalizeRole(input.actorRole) !== 'customer') {
      await this.eventPublisher.publish({
        type: 'OrderSubmittedByStaff',
        payload: {
          orderId: createdOrder.id,
          roundId: submittedRound.id,
          sessionId: submittedRound.sessionId,
          tenantId: submittedRound.tenantId,
          locationId: submittedRound.locationId,
          submittedBy: input.actorId,
          staffRole: normalizeRole(input.actorRole),
        },
      });
    }

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
      round: submittedRound,
      order: createdOrder,
      archivedCart,
      nextCart,
      kitchenTicketIds: [],
      billingReferenceId: null,
    };
  }

  async getSessionOrders(input: SessionOrdersInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!isCollaboratorRole(input.actorRole)) {
      throw new Error('Permission denied for order history');
    }

    await this.assertSessionActive(input.sessionId, input.tenantId, input.locationId);

    const rounds = await this.orderRoundRepository.listBySession(input.sessionId, input.tenantId, input.locationId);
    const orders = await this.orderRoundRepository.listOrdersBySession(input.sessionId, input.tenantId, input.locationId);
    const items = await this.orderRoundRepository.listOrderItemsByOrderIds(
      orders.map((order) => order.id),
      input.tenantId,
      input.locationId,
    );

    const ordersByRoundId = new Map<string, DiningOrderRecord[]>();
    for (const order of orders) {
      const bucket = ordersByRoundId.get(order.roundId) || [];
      bucket.push(order);
      ordersByRoundId.set(order.roundId, bucket);
    }

    const itemsByOrderId = new Map<string, typeof items>();
    for (const item of items) {
      const bucket = itemsByOrderId.get(item.orderId) || [];
      bucket.push(item);
      itemsByOrderId.set(item.orderId, bucket);
    }

    const history = rounds.map((round) => {
      const roundOrders = ordersByRoundId.get(round.id) || [];
      return {
        round,
        orders: roundOrders.map((order) => ({
          ...order,
          items: itemsByOrderId.get(order.id) || [],
        })),
      };
    });

    const totalAmount = sum(orders.map((order) => order.totalAmount));

    return {
      rounds: history,
      totalAmount,
    };
  }

  async cancelRound(input: CancelRoundInput): Promise<OrderRoundRecord> {
    assertScoped(input.tenantId, input.locationId);

    if (!isManagerRole(input.actorRole)) {
      throw new Error('Permission denied for round cancellation');
    }

    const round = await this.orderRoundRepository.findById(input.roundId, input.tenantId, input.locationId);
    if (!round) {
      throw new Error('Order round not found');
    }

    const normalized = normalizeOrderRoundStatus(round.status);
    if (normalized === 'CANCELLED') {
      return round;
    }

    if (!canTransitionOrderRoundStatus(normalized, 'CANCELLED')) {
      throw new Error(`Cannot cancel round from status ${round.status}`);
    }

    const cancelled = await this.orderRoundRepository.updateRound({
      id: round.id,
      tenantId: round.tenantId,
      locationId: round.locationId,
      expectedVersion: round.version,
      status: 'CANCELLED',
      cancelledBy: input.actorId ?? null,
      cancelledAt: new Date(),
      updatedBy: input.actorId ?? null,
    });

    if (!cancelled) {
      throw new Error('Round update conflict');
    }

    if (normalized === 'DRAFT') {
      const cart = await this.resolveRoundCart(round, input.tenantId, input.locationId);
      if (cart && cart.status === 'ACTIVE') {
        await this.cartRepository.updateCart({
          id: cart.id,
          tenantId: cart.tenantId,
          locationId: cart.locationId,
          expectedVersion: cart.version,
          status: 'ARCHIVED',
          subtotal: cart.subtotal,
          total: cart.total,
          updatedBy: input.actorId ?? null,
        });
      }
    }

    const existingOrder = await this.orderRoundRepository.findOrderByRound(round.id, round.tenantId, round.locationId);
    if (existingOrder) {
      await this.orderRoundRepository.updateOrderStatus(
        existingOrder.id,
        existingOrder.tenantId,
        existingOrder.locationId,
        'CANCELLED',
        input.actorId ?? null,
      );
    }

    await this.eventPublisher.publish({
      type: 'OrderRoundCancelled',
      payload: {
        roundId: cancelled.id,
        sessionId: cancelled.sessionId,
        tenantId: cancelled.tenantId,
        locationId: cancelled.locationId,
        previousStatus: normalized,
        nextStatus: 'CANCELLED',
        cancelledBy: input.actorId ?? null,
      },
    });

    return cancelled;
  }

  private async resolveRoundCart(
    round: Pick<OrderRoundRecord, 'draftCartId' | 'roundNumber' | 'sessionId'>,
    tenantId: string,
    locationId: string,
  ): Promise<CartRecord | null> {
    if (round.draftCartId) {
      const byId = await this.cartRepository.findById(round.draftCartId, tenantId, locationId);
      if (byId) {
        return byId;
      }
    }

    return this.cartRepository.findBySessionAndRound(round.sessionId, round.roundNumber, tenantId, locationId);
  }

  private async assertSessionActive(sessionId: string, tenantId: string, locationId: string) {
    const state = await this.sessionStateGateway.getSessionState(sessionId, tenantId, locationId);
    if (!state.exists) {
      throw new Error('Dining session not found');
    }

    if (!isActiveSessionStatus(state.status)) {
      throw new Error('Session is closed or archived');
    }
  }

  private async buildMenuIndex(tenantId: string, locationId: string) {
    const aggregates = await this.menuRepository.findAllByLocation(tenantId, locationId);
    const itemIndex = new Map<string, any>();
    const variantIndex = new Map<string, any>();
    const modifierIndex = new Map<string, any>();

    for (const aggregate of aggregates) {
      const snapshot = aggregate.toJSON();
      for (const item of snapshot.items) {
        itemIndex.set(item.id, item);
      }
      for (const variant of snapshot.variants) {
        variantIndex.set(variant.id, variant);
      }
      for (const modifier of snapshot.modifiers) {
        modifierIndex.set(modifier.id, modifier);
      }
    }

    return {
      itemIndex,
      variantIndex,
      modifierIndex,
    };
  }

  private snapshotOrderItemFromCart(
    cartItem: CartItemRecord,
    menuIndex: {
      itemIndex: Map<string, any>;
      variantIndex: Map<string, any>;
      modifierIndex: Map<string, any>;
    },
  ) {
    const item = menuIndex.itemIndex.get(cartItem.menuItemId);
    if (!item || item.deletedAt !== null || item.status !== 'ACTIVE' || item.availability !== 'AVAILABLE') {
      throw new Error(`Menu item unavailable for submission: ${cartItem.menuItemId}`);
    }

    const variant = cartItem.variantId ? menuIndex.variantIndex.get(cartItem.variantId) : null;
    if (cartItem.variantId && (!variant || variant.deletedAt !== null || variant.status !== 'ACTIVE')) {
      throw new Error(`Variant unavailable for submission: ${cartItem.variantId}`);
    }

    const modifiers = Array.isArray(cartItem.modifiers) ? cartItem.modifiers : [];
    for (const modifier of modifiers) {
      const modifierRecord = modifier as unknown as Record<string, unknown>;
      const id = String(modifierRecord.id || '').trim();
      if (!id) {
        throw new Error('Invalid cart modifier id');
      }

      const exists = menuIndex.modifierIndex.get(id);
      if (!exists || exists.deletedAt !== null || exists.status !== 'ACTIVE') {
        throw new Error(`Modifier unavailable for submission: ${id}`);
      }
    }

    return {
      menuItemId: cartItem.menuItemId,
      quantity: cartItem.quantity,
      unitPrice: cartItem.unitPrice,
      subtotal: cartItem.subtotal,
      itemSnapshot: {
        menuItemId: item.id,
        itemName: item.name,
        variantId: cartItem.variantId ?? null,
        variantName: variant?.name ?? null,
        notes: cartItem.notes ?? null,
        modifiers,
        roundItemStatus: cartItem.status,
      },
      priceSnapshot: {
        unitPrice: cartItem.unitPrice,
        subtotal: cartItem.subtotal,
        quantity: cartItem.quantity,
      },
    };
  }

  private async lockCartItems(
    items: CartItemRecord[],
    tenantId: string,
    locationId: string,
    updatedBy: string | null,
  ) {
    for (const item of items) {
      await this.cartRepository.updateItem({
        id: item.id,
        tenantId,
        locationId,
        expectedVersion: item.version,
        quantity: item.quantity,
        notes: item.notes ?? null,
        modifiers: item.modifiers,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        updatedBy,
        status: 'LOCKED',
      });
    }
  }
}