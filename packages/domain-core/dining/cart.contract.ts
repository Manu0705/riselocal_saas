export type CartStatus = 'ACTIVE' | 'SUBMITTING' | 'SUBMITTED' | 'ARCHIVED';

export type CartItemStatus = 'DRAFT' | 'LOCKED' | 'REMOVED';

export interface CartItemModifier {
  id: string;
  name: string;
  value?: string | boolean | number | null;
}

export interface CartItem {
  id: string;
  cartId: string;
  menuItemId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string | null;
  modifiers: CartItemModifier[];
  unitPrice: number;
  subtotal: number;
  addedBy?: string | null;
  addedAt: string;
  updatedBy?: string | null;
  updatedAt: string;
  status: CartItemStatus;
}

export interface Cart {
  id: string;
  tenantId: string;
  locationId: string;
  sessionId: string;
  roundNumber: number;
  status: CartStatus;
  subtotal: number;
  total: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartSnapshot {
  cartId: string;
  version: number;
  createdAt: string;
  checksum: string;
}