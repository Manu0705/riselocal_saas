import type { OrderRoundStatus, OrderStatus } from './order-round.contract';

export interface OrderRoundCreated {
  roundId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  roundNumber: number;
  cartId: string;
}

export interface OrderRoundSubmitted {
  roundId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  previousStatus: OrderRoundStatus;
  nextStatus: OrderRoundStatus;
  submittedBy?: string | null;
  orderId?: string | null;
}

export interface OrderCreated {
  orderId: string;
  roundId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  status: OrderStatus;
  totalAmount: number;
}

export interface OrderRoundCompleted {
  roundId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  previousStatus: OrderRoundStatus;
  nextStatus: OrderRoundStatus;
}

export interface OrderRoundCancelled {
  roundId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  previousStatus: OrderRoundStatus;
  nextStatus: OrderRoundStatus;
  cancelledBy?: string | null;
}