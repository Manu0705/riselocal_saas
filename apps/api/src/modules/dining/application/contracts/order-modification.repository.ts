import type {
  AdjustmentType,
  ModificationStatus,
  OrderItemAdjustment,
  OrderModificationRequest,
} from '@saas/domain-core/dining/order-modification.contract';
import type { OrderStatus } from '@saas/domain-core/dining/order-round.contract';

export interface OrderSummaryRecord {
  id: string;
  tenantId: string;
  locationId: string;
  sessionId: string;
  status: OrderStatus;
  totalAmount: number;
  version: number;
}

export interface OrderItemSummaryRecord {
  id: string;
  tenantId: string;
  locationId: string;
  orderId: string;
  quantity: number;
  subtotal: number;
  unitPrice: number;
  kitchenStatus: string;
  lockStatus: string;
  itemSnapshot: Record<string, unknown>;
  priceSnapshot: Record<string, unknown>;
  version: number;
}

export interface CreateModificationRequestInput {
  tenantId: string;
  locationId: string;
  orderId: string;
  sessionId: string;
  requestedBy: string;
  reason: string;
  status?: ModificationStatus;
  approvedBy?: string | null;
  completedAt?: Date | null;
  rejectedReason?: string | null;
  idempotencyKey?: string | null;
}

export interface UpdateModificationRequestInput {
  id: string;
  tenantId: string;
  locationId: string;
  status: ModificationStatus;
  approvedBy?: string | null;
  completedAt?: Date | null;
  rejectedReason?: string | null;
}

export interface CreateAdjustmentInput {
  tenantId: string;
  locationId: string;
  orderId: string;
  orderItemId: string;
  modificationRequestId: string;
  type: AdjustmentType;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  reason: string;
  createdBy: string;
}

export interface OrderModificationRepository {
  findOrderById(orderId: string, tenantId: string, locationId: string): Promise<OrderSummaryRecord | null>;
  findOrderItemById(orderItemId: string, tenantId: string, locationId: string): Promise<OrderItemSummaryRecord | null>;
  findModificationById(
    modificationId: string,
    tenantId: string,
    locationId: string,
  ): Promise<OrderModificationRequest | null>;
  findModificationByIdempotency(
    orderId: string,
    tenantId: string,
    locationId: string,
    idempotencyKey: string,
  ): Promise<OrderModificationRequest | null>;
  createModificationRequest(input: CreateModificationRequestInput): Promise<OrderModificationRequest>;
  updateModificationRequest(input: UpdateModificationRequestInput): Promise<OrderModificationRequest | null>;
  createAdjustment(input: CreateAdjustmentInput): Promise<OrderItemAdjustment>;
  listModificationsByOrder(orderId: string, tenantId: string, locationId: string): Promise<OrderModificationRequest[]>;
  listAdjustmentsByModificationIds(
    modificationIds: string[],
    tenantId: string,
    locationId: string,
  ): Promise<OrderItemAdjustment[]>;
  updateOrderItemAsCancelled(
    orderItemId: string,
    tenantId: string,
    locationId: string,
    updatedBy: string,
  ): Promise<OrderItemSummaryRecord | null>;
  updateOrderTotal(orderId: string, tenantId: string, locationId: string, totalAmount: number, updatedBy: string): Promise<void>;
}
