import {
  canTransitionOrderLockStatus,
  isLockedOrderStatus,
  normalizeOrderLockStatus,
} from '@saas/domain-core/dining/order-lock.validation';
import type {
  OrderLockFailureReason,
} from '@saas/domain-core/dining/order-lock.events';
import { isActiveSessionStatus } from '@saas/domain-core/dining/session.validation';
import type { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import type { SessionStateGateway } from '../contracts/session-state.gateway';
import type {
  OrderLockRepository,
  OrderSummaryRecord,
} from '../contracts/order-lock.repository';

interface ScopedRequest {
  tenantId: string;
  locationId: string;
}

interface OrderScopedRequest extends ScopedRequest {
  orderId: string;
}

export interface LockOrderInput extends OrderScopedRequest {
  expectedVersion: number;
  actorId?: string | null;
  actorRole?: string | null;
  actorDeviceId?: string | null;
  reason?: string | null;
  idempotencyKey?: string | null;
}

export interface RequestReopenInput extends OrderScopedRequest {
  actorId?: string | null;
  actorRole?: string | null;
  reason?: string | null;
}

export interface ReopenOrderInput extends OrderScopedRequest {
  actorId?: string | null;
  actorRole?: string | null;
  reason?: string | null;
}

function assertScoped(tenantId: string, locationId: string) {
  if (!tenantId || !locationId) {
    throw new Error('tenantId and locationId are required');
  }
}

function normalizeRole(role?: string | null): string {
  return String(role || '').trim().toLowerCase();
}

function isSubmitterRole(role?: string | null): boolean {
  return ['customer', 'waiter', 'manager', 'owner', 'staff', 'admin', 'super_admin'].includes(normalizeRole(role));
}

function isManagerRole(role?: string | null): boolean {
  return ['manager', 'owner', 'admin', 'super_admin'].includes(normalizeRole(role));
}

export class OrderLockService {
  constructor(
    private readonly repository: OrderLockRepository,
    private readonly sessionStateGateway: SessionStateGateway,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async getLockStatus(input: OrderScopedRequest) {
    assertScoped(input.tenantId, input.locationId);

    const order = await this.requireOrder(input.orderId, input.tenantId, input.locationId);
    const lock = await this.repository.findOrderLock(order.id, input.tenantId, input.locationId);

    return lock ?? {
      id: `lock-${order.id}`,
      orderId: order.id,
      tenantId: order.tenantId,
      locationId: order.locationId,
      status: 'UNLOCKED' as const,
      lockedBy: null,
      lockedAt: null,
      reason: null,
      version: 0,
    };
  }

  async lockOrder(input: LockOrderInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!isSubmitterRole(input.actorRole)) {
      await this.emitLockFailed(input, 'PERMISSION_DENIED', 'Permission denied for order locking');
      throw new Error('Permission denied for order locking');
    }

    const order = await this.requireOrder(input.orderId, input.tenantId, input.locationId);
    await this.assertSessionActive(order);

    const items = await this.repository.listOrderItems(order.id, order.tenantId, order.locationId);
    if (items.length === 0) {
      await this.emitLockFailed(input, 'LOCK_STATE_INVALID', 'Order has no items to lock');
      throw new Error('Order has no items to lock');
    }

    const now = new Date();
    const existing = await this.repository.findOrderLock(order.id, order.tenantId, order.locationId);
    if (existing && isLockedOrderStatus(normalizeOrderLockStatus(existing.status))) {
      const isSameKey =
        !!input.idempotencyKey &&
        !!existing.reason &&
        existing.reason.includes(`idem:${input.idempotencyKey}`);

      if (isSameKey || !input.idempotencyKey) {
        return {
          orderId: order.id,
          status: 'LOCKED' as const,
          lockedBy: existing.lockedBy ?? null,
          lockedAt: existing.lockedAt ?? now,
        };
      }
    }

    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 0) {
      throw new Error('version is required');
    }

    await this.eventPublisher.publish({
      type: 'OrderLockRequested',
      payload: {
        orderId: order.id,
        tenantId: order.tenantId,
        locationId: order.locationId,
        requestedBy: input.actorId ?? 'unknown',
        requestedAt: now,
      },
    });

    const lockReason = [input.reason ? String(input.reason).trim() : '', input.idempotencyKey ? `idem:${input.idempotencyKey}` : '']
      .filter(Boolean)
      .join(' | ') || null;

    const updatedOrder = await this.repository.updateOrderStatus(
      order.id,
      order.tenantId,
      order.locationId,
      'LOCKED',
      input.actorId ?? null,
      input.expectedVersion,
    );

    if (!updatedOrder) {
      await this.emitLockFailed(input, 'VERSION_CONFLICT', 'Order version conflict');
      throw new Error('Order version conflict');
    }

    await this.repository.updateOrderItemsLock(
      order.id,
      order.tenantId,
      order.locationId,
      'LOCKED',
      input.actorId ?? null,
      now,
    );

    const lock = await this.repository.upsertOrderLock({
      orderId: order.id,
      tenantId: order.tenantId,
      locationId: order.locationId,
      status: 'LOCKED',
      lockedBy: input.actorId ?? null,
      lockedAt: now,
      reason: lockReason,
      idempotencyKey: input.idempotencyKey ?? null,
    });

    await this.repository.createOrderLockEvent({
      orderId: order.id,
      tenantId: order.tenantId,
      locationId: order.locationId,
      action: 'LOCKED',
      performedBy: input.actorId ?? null,
      previousState: existing?.status ?? 'UNLOCKED',
      newState: 'LOCKED',
      reason: lockReason,
    });

    await this.eventPublisher.publish({
      type: 'OrderLocked',
      payload: {
        orderId: order.id,
        sessionId: order.sessionId,
        tenantId: order.tenantId,
        locationId: order.locationId,
        previousStatus: normalizeOrderLockStatus(existing?.status ?? 'UNLOCKED'),
        nextStatus: 'LOCKED',
        lockedBy: input.actorId ?? 'unknown',
        lockedAt: now,
      },
    });

    return {
      orderId: updatedOrder.id,
      status: lock.status,
      lockedBy: lock.lockedBy ?? null,
      lockedAt: lock.lockedAt ?? now,
    };
  }

  async requestReopen(input: RequestReopenInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!isSubmitterRole(input.actorRole)) {
      throw new Error('Permission denied for reopen request');
    }

    const order = await this.requireOrder(input.orderId, input.tenantId, input.locationId);
    const existing = await this.repository.findOrderLock(order.id, order.tenantId, order.locationId);

    const current = normalizeOrderLockStatus(existing?.status ?? 'UNLOCKED');
    if (!isLockedOrderStatus(current)) {
      throw new Error('Order is not locked');
    }

    if (!canTransitionOrderLockStatus(current, 'REOPEN_REQUESTED')) {
      throw new Error(`Cannot request reopen from ${current}`);
    }

    const now = new Date();
    const reason = String(input.reason || '').trim() || null;

    const updatedOrder = await this.repository.updateOrderStatus(
      order.id,
      order.tenantId,
      order.locationId,
      'REOPEN_REQUESTED',
      input.actorId ?? null,
    );

    if (!updatedOrder) {
      throw new Error('Order update conflict');
    }

    const updatedLock = await this.repository.upsertOrderLock({
      orderId: order.id,
      tenantId: order.tenantId,
      locationId: order.locationId,
      status: 'REOPEN_REQUESTED',
      lockedBy: existing?.lockedBy ?? null,
      lockedAt: existing?.lockedAt ? new Date(existing.lockedAt) : null,
      reason,
      idempotencyKey: null,
    });

    await this.repository.createOrderLockEvent({
      orderId: order.id,
      tenantId: order.tenantId,
      locationId: order.locationId,
      action: 'REOPEN_REQUESTED',
      performedBy: input.actorId ?? null,
      previousState: current,
      newState: 'REOPEN_REQUESTED',
      reason,
    });

    return {
      orderId: order.id,
      status: updatedLock.status,
      reason,
      requestedAt: now,
    };
  }

  async reopenOrder(input: ReopenOrderInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!isManagerRole(input.actorRole)) {
      throw new Error('Permission denied for order reopen');
    }

    const order = await this.requireOrder(input.orderId, input.tenantId, input.locationId);
    const existing = await this.repository.findOrderLock(order.id, order.tenantId, order.locationId);
    const current = normalizeOrderLockStatus(existing?.status ?? 'UNLOCKED');

    if (!canTransitionOrderLockStatus(current, 'REOPENED')) {
      throw new Error(`Cannot reopen order from ${current}`);
    }

    const reason = String(input.reason || '').trim() || null;
    const now = new Date();

    const updatedOrder = await this.repository.updateOrderStatus(
      order.id,
      order.tenantId,
      order.locationId,
      'REOPENED',
      input.actorId ?? null,
    );

    if (!updatedOrder) {
      throw new Error('Order update conflict');
    }

    await this.repository.updateOrderItemsLock(
      order.id,
      order.tenantId,
      order.locationId,
      'DRAFT',
      null,
      null,
    );

    const lock = await this.repository.upsertOrderLock({
      orderId: order.id,
      tenantId: order.tenantId,
      locationId: order.locationId,
      status: 'REOPENED',
      lockedBy: null,
      lockedAt: null,
      reason,
      idempotencyKey: null,
    });

    await this.repository.createOrderLockEvent({
      orderId: order.id,
      tenantId: order.tenantId,
      locationId: order.locationId,
      action: 'REOPENED',
      performedBy: input.actorId ?? null,
      previousState: current,
      newState: 'REOPENED',
      reason,
    });

    await this.eventPublisher.publish({
      type: 'OrderReopened',
      payload: {
        orderId: order.id,
        sessionId: order.sessionId,
        tenantId: order.tenantId,
        locationId: order.locationId,
        managerId: input.actorId ?? 'unknown',
        reason,
      },
    });

    return {
      orderId: order.id,
      status: lock.status,
      reason,
      reopenedAt: now,
    };
  }

  private async requireOrder(orderId: string, tenantId: string, locationId: string): Promise<OrderSummaryRecord> {
    const order = await this.repository.findOrderById(orderId, tenantId, locationId);
    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  private async assertSessionActive(order: OrderSummaryRecord) {
    const sessionState = await this.sessionStateGateway.getSessionState(order.sessionId, order.tenantId, order.locationId);
    if (!sessionState.exists || !isActiveSessionStatus(sessionState.status)) {
      throw new Error('Session is closed or archived');
    }
  }

  private async emitLockFailed(
    input: { orderId: string; tenantId: string; locationId: string; actorId?: string | null },
    reasonCode: OrderLockFailureReason,
    message: string,
  ) {
    await this.eventPublisher.publish({
      type: 'OrderLockFailed',
      payload: {
        orderId: input.orderId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        reasonCode,
        message,
        requestedBy: input.actorId ?? null,
      },
    });
  }
}
