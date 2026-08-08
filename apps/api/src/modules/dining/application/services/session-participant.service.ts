import {
  isActiveSessionStatus,
  normalizeSessionParticipantRole,
} from '@saas/domain-core/dining/session.validation';
import { resolveSessionParticipantPermissions } from '@saas/domain-core/dining/waiter-assist.permissions';
import type { SessionParticipantRole } from '@saas/domain-core/dining/session.contract';
import type { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import type {
  SessionParticipantRecord,
  SessionParticipantRepository,
} from '../contracts/session-participant.repository';

interface ScopedRequest {
  tenantId: string;
  locationId: string;
}

interface SessionScopedRequest extends ScopedRequest {
  sessionId: string;
}

export interface JoinSessionParticipantInput extends SessionScopedRequest {
  actorId: string;
  actorRole?: string | null;
  participantType?: string;
  displayName?: string | null;
  deviceId?: string | null;
}

export interface LeaveSessionParticipantInput extends ScopedRequest {
  sessionId: string;
  participantId: string;
  actorId: string;
  actorRole?: string | null;
}

export interface ListSessionParticipantsInput extends SessionScopedRequest {
  includeLeft?: boolean;
  actorRole?: string | null;
}

export interface TransferSessionOwnershipInput extends SessionScopedRequest {
  actorId: string;
  actorRole?: string | null;
  participantId: string;
}

function assertScoped(tenantId: string, locationId: string) {
  if (!tenantId || !locationId) {
    throw new Error('tenantId and locationId are required');
  }
}

function normalizeRole(role?: string | null): string {
  return String(role || '').trim().toLowerCase();
}

function isStaffRole(role?: string | null): boolean {
  return ['waiter', 'manager', 'cashier', 'owner', 'staff', 'admin', 'super_admin'].includes(normalizeRole(role));
}

function isManagerRole(role?: string | null): boolean {
  return ['manager', 'owner', 'admin', 'super_admin'].includes(normalizeRole(role));
}

function isStaffParticipantType(role: SessionParticipantRole): boolean {
  return role === 'WAITER' || role === 'MANAGER' || role === 'CASHIER';
}

function isActiveParticipantStatus(status: string): boolean {
  return ['JOINING', 'ACTIVE', 'IDLE', 'DISCONNECTED'].includes(String(status || '').toUpperCase());
}

export class SessionParticipantService {
  constructor(
    private readonly repository: SessionParticipantRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
  ) {}

  async joinParticipant(input: JoinSessionParticipantInput): Promise<SessionParticipantRecord> {
    assertScoped(input.tenantId, input.locationId);

    if (!input.actorId) {
      throw new Error('actorId is required');
    }

    if (!isStaffRole(input.actorRole)) {
      throw new Error('Permission denied for participant join');
    }

    const participantType = normalizeSessionParticipantRole(input.participantType || 'WAITER');
    if (!isStaffParticipantType(participantType)) {
      throw new Error('Only staff participant types are allowed in this endpoint');
    }

    const session = await this.repository.findSessionById(input.sessionId, input.tenantId, input.locationId);
    if (!session) {
      throw new Error('Dining session not found');
    }

    if (!isActiveSessionStatus(session.status)) {
      throw new Error('Session is closed or archived');
    }

    const existing = await this.repository.findActiveParticipantByActor(
      input.sessionId,
      input.tenantId,
      input.locationId,
      input.actorId,
      participantType,
    );

    if (existing) {
      return existing;
    }

    const now = new Date();
    const created = await this.repository.createParticipant({
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: input.sessionId,
      actorId: input.actorId,
      role: participantType,
      participantType,
      displayName: input.displayName ?? null,
      deviceId: String(input.deviceId || `staff-${input.actorId}`).trim(),
      status: 'ACTIVE',
      permissions: resolveSessionParticipantPermissions(participantType),
      joinedBy: input.actorId,
      joinedAt: now,
      lastSeenAt: now,
    });

    await this.eventPublisher.publish({
      type: 'ParticipantJoined',
      payload: {
        sessionId: created.sessionId,
        tenantId: created.tenantId,
        locationId: created.locationId,
        participantId: created.id,
        deviceId: created.deviceId,
        role: created.participantType,
      },
    });

    if (participantType === 'WAITER') {
      await this.eventPublisher.publish({
        type: 'WaiterJoinedSession',
        payload: {
          sessionId: created.sessionId,
          tenantId: created.tenantId,
          locationId: created.locationId,
          participantId: created.id,
          waiterId: created.actorId || input.actorId,
          joinedAt: created.joinedAt,
        },
      });
    }

    return created;
  }

  async leaveParticipant(input: LeaveSessionParticipantInput): Promise<SessionParticipantRecord> {
    assertScoped(input.tenantId, input.locationId);

    const session = await this.repository.findSessionById(input.sessionId, input.tenantId, input.locationId);
    if (!session) {
      throw new Error('Dining session not found');
    }

    const participant = await this.repository.findParticipantById(input.participantId, input.tenantId, input.locationId);
    if (!participant || participant.sessionId !== input.sessionId) {
      throw new Error('Participant not found');
    }

    if (!isActiveParticipantStatus(participant.status)) {
      return participant;
    }

    const manager = isManagerRole(input.actorRole);
    const isSelf = !!participant.actorId && participant.actorId === input.actorId;

    if (!isSelf && !manager) {
      throw new Error('Permission denied for participant removal');
    }

    const status = manager && !isSelf ? 'REMOVED' : 'LEFT';
    const leftAt = new Date();

    const updated = await this.repository.updateParticipantStatus(
      participant.id,
      input.tenantId,
      input.locationId,
      status,
      leftAt,
    );

    if (!updated) {
      throw new Error('Participant update conflict');
    }

    await this.eventPublisher.publish({
      type: 'ParticipantLeft',
      payload: {
        sessionId: updated.sessionId,
        tenantId: updated.tenantId,
        locationId: updated.locationId,
        participantId: updated.id,
        deviceId: updated.deviceId,
        role: updated.participantType,
      },
    });

    await this.eventPublisher.publish({
      type: 'ParticipantLeftSession',
      payload: {
        participantId: updated.id,
        sessionId: updated.sessionId,
        tenantId: updated.tenantId,
        locationId: updated.locationId,
        status,
        leftAt,
      },
    });

    return updated;
  }

  async listParticipants(input: ListSessionParticipantsInput): Promise<SessionParticipantRecord[]> {
    assertScoped(input.tenantId, input.locationId);

    if (!isStaffRole(input.actorRole)) {
      throw new Error('Permission denied for participant list');
    }

    const session = await this.repository.findSessionById(input.sessionId, input.tenantId, input.locationId);
    if (!session) {
      throw new Error('Dining session not found');
    }

    return this.repository.listParticipants(
      input.sessionId,
      input.tenantId,
      input.locationId,
      input.includeLeft,
    );
  }

  async transferOwnership(input: TransferSessionOwnershipInput) {
    assertScoped(input.tenantId, input.locationId);

    if (!isManagerRole(input.actorRole)) {
      throw new Error('Permission denied for ownership transfer');
    }

    const session = await this.repository.findSessionById(input.sessionId, input.tenantId, input.locationId);
    if (!session) {
      throw new Error('Dining session not found');
    }

    if (!isActiveSessionStatus(session.status)) {
      throw new Error('Session is closed or archived');
    }

    const target = await this.repository.findParticipantById(input.participantId, input.tenantId, input.locationId);
    if (!target || target.sessionId !== input.sessionId) {
      throw new Error('Participant not found');
    }

    if (!isStaffParticipantType(target.participantType)) {
      throw new Error('Ownership can only be assigned to staff participants');
    }

    if (!target.actorId) {
      throw new Error('Target staff participant has no actor identity');
    }

    const updated = await this.repository.assignWaiter(
      input.sessionId,
      input.tenantId,
      input.locationId,
      target.actorId,
      input.actorId,
    );

    if (!updated) {
      throw new Error('Failed to transfer ownership');
    }

    await this.eventPublisher.publish({
      type: 'SessionOwnershipTransferred',
      payload: {
        sessionId: updated.id,
        tenantId: updated.tenantId,
        locationId: updated.locationId,
        previousWaiterId: session.assignedWaiterId ?? null,
        nextWaiterId: target.actorId,
        transferredBy: input.actorId,
      },
    });

    return {
      sessionId: updated.id,
      assignedWaiterId: updated.assignedWaiterId ?? target.actorId,
    };
  }
}
