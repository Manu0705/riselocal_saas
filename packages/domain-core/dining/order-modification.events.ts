import type { AdjustmentType, ModificationStatus } from './order-modification.contract';

export interface OrderModificationRequested {
  modificationId: string;
  orderId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  requestedBy: string;
  reason: string;
}

export interface OrderModificationApproved {
  modificationId: string;
  orderId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  approvedBy: string;
  previousStatus: ModificationStatus;
  nextStatus: ModificationStatus;
}

export interface OrderModificationRejected {
  modificationId: string;
  orderId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  rejectedBy: string;
  previousStatus: ModificationStatus;
  nextStatus: ModificationStatus;
  reason: string;
}

export interface OrderItemCancelled {
  modificationId: string;
  orderId: string;
  orderItemId: string;
  tenantId: string;
  locationId: string;
  cancelledBy: string;
  reason: string;
}

export interface OrderModified {
  modificationId: string;
  orderId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  completedBy: string;
  adjustmentType: AdjustmentType;
}
