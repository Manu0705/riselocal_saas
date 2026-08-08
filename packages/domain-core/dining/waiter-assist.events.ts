export interface WaiterJoinedSession {
  sessionId: string;
  tenantId: string;
  locationId: string;
  participantId: string;
  waiterId: string;
  joinedAt: string | Date;
}

export interface ParticipantLeftSession {
  participantId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  status: 'LEFT' | 'REMOVED';
  leftAt: string | Date;
}

export interface AssistedItemAdded {
  sessionId: string;
  tenantId: string;
  locationId: string;
  cartId: string;
  itemId: string;
  waiterId: string;
}

export interface OrderSubmittedByStaff {
  orderId: string;
  roundId: string;
  sessionId: string;
  tenantId: string;
  locationId: string;
  submittedBy: string;
  staffRole: string;
}

export interface SessionOwnershipTransferred {
  sessionId: string;
  tenantId: string;
  locationId: string;
  previousWaiterId?: string | null;
  nextWaiterId: string;
  transferredBy: string;
}