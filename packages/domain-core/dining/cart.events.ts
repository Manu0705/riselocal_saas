import type { CartItemStatus, CartStatus } from './cart.contract';

export interface CartCreated {
  cartId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  roundNumber: number;
}

export interface CartItemAdded {
  cartId: string;
  itemId: string;
  menuItemId: string;
  tenantId: string;
  locationId: string;
  addedBy?: string | null;
}

export interface CartItemUpdated {
  cartId: string;
  itemId: string;
  tenantId: string;
  locationId: string;
  previousQuantity: number;
  nextQuantity: number;
  status: CartItemStatus;
  changedBy?: string | null;
}

export interface CartItemRemoved {
  cartId: string;
  itemId: string;
  tenantId: string;
  locationId: string;
  removedBy?: string | null;
}

export interface CartSubmitted {
  cartId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  previousStatus: CartStatus;
  nextStatus: CartStatus;
  orderRoundId?: string | null;
  submittedBy?: string | null;
}