export interface OrderRoundRequestContextDTO {
  tenantId: string;
  locationId: string;
  actorId: string | null;
  actorRole: string | null;
}

export interface CreateOrderRoundRequestDTO {
  sessionId: string;
}

export interface SubmitOrderRoundRequestDTO {
  roundId: string;
  idempotencyKey?: string | null;
}

export interface CancelOrderRoundRequestDTO {
  roundId: string;
}

export function mapEntityResponse<T extends Record<string, unknown>>(value: T): T {
  return value;
}