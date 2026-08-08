export interface CartRequestContextDTO {
  tenantId: string;
  locationId: string;
  actorId: string | null;
  actorRole: string | null;
}

export interface CartAddItemRequestDTO {
  sessionId: string;
  menuItemId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string | null;
  modifiers?: Array<{ id: string; name: string; value?: string | boolean | number | null }>;
}

export interface CartUpdateItemRequestDTO {
  itemId: string;
  quantity: number;
  notes?: string | null;
  modifiers?: Array<{ id: string; name: string; value?: string | boolean | number | null }>;
}

export function mapEntityResponse<T extends Record<string, unknown>>(value: T): T {
  return value;
}