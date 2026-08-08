export type ModificationStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';

export type AdjustmentType = 'CANCEL' | 'QUANTITY_CHANGE' | 'REPLACE' | 'ADD_NOTE';

export interface OrderModificationRequest {
  id: string;
  tenantId: string;
  locationId: string;
  orderId: string;
  sessionId: string;
  requestedBy: string;
  reason: string;
  status: ModificationStatus;
  approvedBy?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  completedAt?: string | Date | null;
}

export interface OrderItemAdjustment {
  id: string;
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
  createdAt: string | Date;
}

export interface ModificationHistoryEntry {
  request: OrderModificationRequest;
  adjustments: OrderItemAdjustment[];
}
