import {
  canTransitionModificationStatus,
  isMutableKitchenStatus,
  normalizeAdjustmentType,
  normalizeModificationStatus,
} from '@saas/domain-core/dining/order-modification.validation';
import type { AdjustmentType } from '@saas/domain-core/dining/order-modification.contract';
import { isActiveSessionStatus } from '@saas/domain-core/dining/session.validation';
import type { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import type { SessionStateGateway } from '../contracts/session-state.gateway';
import type {
  CreateAdjustmentInput,
  OrderModificationRepository,
  OrderSummaryRecord,
} from '../contracts/order-modification.repository';

interface ScopedRequest {
  tenantId: string;
  locationId: string;
}

export interface RequestModificationInput extends ScopedRequest {
  orderId: string;
  orderItemId?: string | null;
  requestedBy: string;
  actorRole?: string | null;
  reason: string;
  adjustmentType?: AdjustmentType | string;
  newValue?: Record<string, unknown> | null;
  idempotencyKey?: string | null;
}

export interface ApproveModificationInput extends ScopedRequest {
  modificationId: string;
  approvedBy: string;
  actorRole?: string | null;
}

export interface RejectModificationInput extends ScopedRequest {
  modificationId: string;
  rejectedBy: string;
  actorRole?: string | null;
  reason: string;
}

export interface CancelOrderItemInput extends ScopedRequest {
  orderItemId: string;
  orderId: string;
  requestedBy: string;
  actorRole?: string | null;
  reason: string;
  idempotencyKey?: string | null;
}

export interface ListModificationHistoryInput extends ScopedRequest {
  orderId: string;
  actorRole?: string | null;
}

function assertScoped(tenantId: string, locationId: string) {
  if (!tenantId || !locationId) {
    throw new Error('tenantId and locationId are required');
  }
}

function normalizeRole(role?: string | null): string {
  return String(role || '').trim().toLowerCase();
}

function isRequesterRole(role?: string | null): boolean {
  return ['customer', 'waiter', 'manager', 'owner', 'staff', 'admin', 'super_admin'].includes(normalizeRole(role));
}

function isManagerRole(role?: string | null): boolean {
  return ['manager', 'owner', 'admin', 'super_admin'].includes(normalizeRole(role));
}

function calculateAdjustedTotal(totalAmount: number, itemSubtotal: number, type: AdjustmentType): number {
  if (type === 'CANCEL') {
    return Math.max(0, totalAmount - Math.max(0, itemSubtotal));
  }

  return totalAmount;
}

export class OrderModificationService {
  constructor(
    private readonly repository: OrderModificationRepository,
    private readonly sessionStateGateway: SessionStateGateway,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async requestModification(input: RequestModificationInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!input.requestedBy) {
      throw new Error('requestedBy is required');
    }

    if (!isRequesterRole(input.actorRole)) {
      throw new Error('Permission denied for modification request');
    }

    const reason = String(input.reason || '').trim();
    if (!reason) {
      throw new Error('reason is required');
    }

    const order = await this.requireOrder(input.orderId, input.tenantId, input.locationId);
    await this.assertSessionActive(order);

    if (input.idempotencyKey) {
      const existing = await this.repository.findModificationByIdempotency(
        order.id,
        order.tenantId,
        order.locationId,
        input.idempotencyKey,
      );

      if (existing) {
        return existing;
      }
    }

    const now = new Date();
    const created = await this.repository.createModificationRequest({
      tenantId: order.tenantId,
      locationId: order.locationId,
      orderId: order.id,
      sessionId: order.sessionId,
      requestedBy: input.requestedBy,
      reason,
      status: 'REQUESTED',
      idempotencyKey: input.idempotencyKey ?? null,
    });

    if (input.orderItemId) {
      const item = await this.repository.findOrderItemById(input.orderItemId, input.tenantId, input.locationId);
      if (!item || item.orderId !== order.id) {
        throw new Error('Order item not found');
      }

      if (!isManagerRole(input.actorRole) && !isMutableKitchenStatus(item.kitchenStatus)) {
        throw new Error('Order item cannot be modified in current kitchen state');
      }

      const adjustmentType = normalizeAdjustmentType(input.adjustmentType || 'CANCEL');
      await this.repository.createAdjustment({
        tenantId: order.tenantId,
        locationId: order.locationId,
        orderId: order.id,
        orderItemId: item.id,
        modificationRequestId: created.id,
        type: adjustmentType,
        oldValue: {
          quantity: item.quantity,
          subtotal: item.subtotal,
          kitchenStatus: item.kitchenStatus,
        },
        newValue: input.newValue ?? null,
        reason,
        createdBy: input.requestedBy,
      });
    }

    await this.eventPublisher.publish({
      type: 'OrderModificationRequested',
      payload: {
        modificationId: created.id,
        orderId: created.orderId,
        sessionId: created.sessionId,
        tenantId: created.tenantId,
        locationId: created.locationId,
        requestedBy: created.requestedBy,
        reason: created.reason,
      },
    });

    return {
      ...created,
      requestedAt: now,
    };
  }

  async approveModification(input: ApproveModificationInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!isManagerRole(input.actorRole)) {
      throw new Error('Permission denied for modification approval');
    }

    const existing = await this.repository.findModificationById(input.modificationId, input.tenantId, input.locationId);
    if (!existing) {
      throw new Error('Modification request not found');
    }

    const current = normalizeModificationStatus(existing.status);
    if (!canTransitionModificationStatus(current, 'APPROVED')) {
      throw new Error(`Cannot approve request from status ${current}`);
    }

    const adjustments = await this.repository.listAdjustmentsByModificationIds([existing.id], input.tenantId, input.locationId);

    const approved = await this.repository.updateModificationRequest({
      id: existing.id,
      tenantId: input.tenantId,
      locationId: input.locationId,
      status: 'APPROVED',
      approvedBy: input.approvedBy,
    });

    if (!approved) {
      throw new Error('Modification update conflict');
    }

    let nextTotal = (await this.requireOrder(existing.orderId, input.tenantId, input.locationId)).totalAmount;

    for (const adjustment of adjustments) {
      if (adjustment.type === 'CANCEL') {
        const item = await this.repository.findOrderItemById(adjustment.orderItemId, input.tenantId, input.locationId);
        if (!item) {
          continue;
        }

        await this.repository.updateOrderItemAsCancelled(item.id, input.tenantId, input.locationId, input.approvedBy);
        nextTotal = calculateAdjustedTotal(nextTotal, item.subtotal, adjustment.type);

        await this.eventPublisher.publish({
          type: 'OrderItemCancelled',
          payload: {
            modificationId: existing.id,
            orderId: existing.orderId,
            orderItemId: item.id,
            tenantId: existing.tenantId,
            locationId: existing.locationId,
            cancelledBy: input.approvedBy,
            reason: existing.reason,
          },
        });
      }

      await this.eventPublisher.publish({
        type: 'OrderModified',
        payload: {
          modificationId: existing.id,
          orderId: existing.orderId,
          sessionId: existing.sessionId,
          tenantId: existing.tenantId,
          locationId: existing.locationId,
          completedBy: input.approvedBy,
          adjustmentType: adjustment.type,
        },
      });
    }

    await this.repository.updateOrderTotal(existing.orderId, input.tenantId, input.locationId, nextTotal, input.approvedBy);

    const completed = await this.repository.updateModificationRequest({
      id: existing.id,
      tenantId: input.tenantId,
      locationId: input.locationId,
      status: 'COMPLETED',
      approvedBy: input.approvedBy,
      completedAt: new Date(),
    });

    await this.eventPublisher.publish({
      type: 'OrderModificationApproved',
      payload: {
        modificationId: existing.id,
        orderId: existing.orderId,
        sessionId: existing.sessionId,
        tenantId: existing.tenantId,
        locationId: existing.locationId,
        approvedBy: input.approvedBy,
        previousStatus: current,
        nextStatus: 'APPROVED',
      },
    });

    return completed ?? approved;
  }

  async rejectModification(input: RejectModificationInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!isManagerRole(input.actorRole)) {
      throw new Error('Permission denied for modification rejection');
    }

    const reason = String(input.reason || '').trim();
    if (!reason) {
      throw new Error('reason is required');
    }

    const existing = await this.repository.findModificationById(input.modificationId, input.tenantId, input.locationId);
    if (!existing) {
      throw new Error('Modification request not found');
    }

    const current = normalizeModificationStatus(existing.status);
    if (!canTransitionModificationStatus(current, 'REJECTED')) {
      throw new Error(`Cannot reject request from status ${current}`);
    }

    const updated = await this.repository.updateModificationRequest({
      id: existing.id,
      tenantId: input.tenantId,
      locationId: input.locationId,
      status: 'REJECTED',
      approvedBy: input.rejectedBy,
      rejectedReason: reason,
      completedAt: new Date(),
    });

    if (!updated) {
      throw new Error('Modification update conflict');
    }

    await this.eventPublisher.publish({
      type: 'OrderModificationRejected',
      payload: {
        modificationId: existing.id,
        orderId: existing.orderId,
        sessionId: existing.sessionId,
        tenantId: existing.tenantId,
        locationId: existing.locationId,
        rejectedBy: input.rejectedBy,
        previousStatus: current,
        nextStatus: 'REJECTED',
        reason,
      },
    });

    return updated;
  }

  async cancelOrderItem(input: CancelOrderItemInput) {
    assertScoped(input.tenantId, input.locationId);

    const reason = String(input.reason || '').trim();
    if (!reason) {
      throw new Error('reason is required');
    }

    const item = await this.repository.findOrderItemById(input.orderItemId, input.tenantId, input.locationId);
    if (!item || item.orderId !== input.orderId) {
      throw new Error('Order item not found');
    }

    if (!isManagerRole(input.actorRole) && !isMutableKitchenStatus(item.kitchenStatus)) {
      throw new Error('Order item cannot be modified in current kitchen state');
    }

    const requested = await this.requestModification({
      orderId: input.orderId,
      orderItemId: item.id,
      tenantId: input.tenantId,
      locationId: input.locationId,
      requestedBy: input.requestedBy,
      actorRole: input.actorRole,
      reason,
      adjustmentType: 'CANCEL',
      idempotencyKey: input.idempotencyKey,
    });

    if (isManagerRole(input.actorRole)) {
      return this.approveModification({
        modificationId: requested.id,
        tenantId: input.tenantId,
        locationId: input.locationId,
        approvedBy: input.requestedBy,
        actorRole: input.actorRole,
      });
    }

    return requested;
  }

  async listModificationHistory(input: ListModificationHistoryInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!isRequesterRole(input.actorRole)) {
      throw new Error('Permission denied for modification history');
    }

    const order = await this.requireOrder(input.orderId, input.tenantId, input.locationId);
    const requests = await this.repository.listModificationsByOrder(order.id, input.tenantId, input.locationId);
    const adjustments = await this.repository.listAdjustmentsByModificationIds(
      requests.map((request) => request.id),
      input.tenantId,
      input.locationId,
    );

    const byRequest = new Map();
    for (const adjustment of adjustments) {
      const bucket = byRequest.get(adjustment.modificationRequestId) || [];
      bucket.push(adjustment);
      byRequest.set(adjustment.modificationRequestId, bucket);
    }

    return requests.map((request) => ({
      request,
      adjustments: byRequest.get(request.id) || [],
    }));
  }

  private async requireOrder(orderId: string, tenantId: string, locationId: string): Promise<OrderSummaryRecord> {
    const order = await this.repository.findOrderById(orderId, tenantId, locationId);
    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  private async assertSessionActive(order: OrderSummaryRecord) {
    const state = await this.sessionStateGateway.getSessionState(order.sessionId, order.tenantId, order.locationId);
    if (!state.exists || !isActiveSessionStatus(state.status)) {
      throw new Error('Session is closed or archived');
    }
  }
}
