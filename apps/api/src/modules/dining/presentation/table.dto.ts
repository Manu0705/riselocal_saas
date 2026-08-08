export interface TableRequestContextDTO {
  tenantId: string;
  locationId: string;
  actorId: string | null;
  actorRole: string | null;
}

export interface TableListRequestDTO {
  status?: string;
}

export interface TableStatusRequestDTO {
  status: string;
  activeSessionId?: string | null;
}

export interface TableWaiterRequestDTO {
  waiterId: string;
}

export function mapEntityResponse<T extends Record<string, unknown>>(value: T): T {
  return value;
}