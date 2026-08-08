import { randomBytes } from 'crypto';
import {
  isClosedLikeSessionStatus,
  isJoinableSessionStatus,
  isValidDeviceId,
  isValidSessionToken,
  normalizeSessionParticipantRole,
} from '@saas/domain-core/dining/session.validation';
import { resolveSessionParticipantPermissions } from '@saas/domain-core/dining/waiter-assist.permissions';
import type { SessionParticipantRole } from '@saas/domain-core/dining/session.contract';
import type { DiningDomainEventPublisher } from '../contracts/domain-event.publisher';
import type {
  SessionParticipantRecord,
  SessionTokenRecord,
  SessionTokenRepository,
} from '../contracts/session-token.repository';
import type { SessionStateGateway } from '../contracts/session-state.gateway';

interface ScopedRequest {
  tenantId: string;
  locationId: string;
}

interface GenerateSessionTokenInput extends ScopedRequest {
  sessionId: string;
  createdBy?: string | null;
  expiresAt?: Date;
  joinBaseUrl?: string;
}

interface ValidateSessionTokenInput extends ScopedRequest {
  token: string;
}

interface JoinSessionInput extends ScopedRequest {
  token: string;
  role: SessionParticipantRole | string;
  deviceId: string;
  displayName?: string | null;
  actorId?: string | null;
  participantLimit?: number;
}

interface LeaveSessionInput extends ScopedRequest {
  token: string;
  role: SessionParticipantRole | string;
  deviceId: string;
}

interface RegenerateSessionTokenInput extends ScopedRequest {
  sessionId: string;
  regeneratedBy?: string | null;
  expiresAt?: Date;
  joinBaseUrl?: string;
}

interface GetParticipantsInput extends ScopedRequest {
  sessionId: string;
  includeLeft?: boolean;
}

function assertTenantLocation(tenantId: string, locationId: string) {
  if (!tenantId || !locationId) {
    throw new Error('tenantId and locationId are required');
  }
}

function toJoinUrl(baseUrl: string | undefined, token: string): string | undefined {
  if (!baseUrl) {
    return undefined;
  }

  const cleaned = baseUrl.trim().replace(/\/+$/, '');
  if (!cleaned) {
    return undefined;
  }

  return `${cleaned}/join/${token}`;
}

function isExpired(record: SessionTokenRecord, now: Date): boolean {
  return record.expiresAt.getTime() <= now.getTime();
}

export class SessionTokenService {
  constructor(
    private readonly repository: SessionTokenRepository,
    private readonly eventPublisher: DiningDomainEventPublisher,
    private readonly sessionStateGateway: SessionStateGateway,
  ) {}

  async generateToken(input: GenerateSessionTokenInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const state = await this.sessionStateGateway.getSessionState(input.sessionId, input.tenantId, input.locationId);
    if (!state.exists) {
      throw new Error('Dining session not found');
    }
    if (!isJoinableSessionStatus(state.status)) {
      throw new Error('Session is closed or archived');
    }

    const now = new Date();
    const existing = await this.repository.findBySession(input.sessionId, input.tenantId, input.locationId);

    if (existing && (existing.status === 'ACTIVE' || existing.status === 'GENERATED') && !isExpired(existing, now)) {
      return {
        ...existing,
        joinUrl: toJoinUrl(input.joinBaseUrl, existing.token),
      };
    }

    const token = await this.createUniqueToken();
    const expiresAt = input.expiresAt ?? new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const saved = await this.repository.upsertToken({
      id: existing?.id,
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: input.sessionId,
      token,
      status: 'ACTIVE',
      expiresAt,
      createdBy: input.createdBy,
      regeneratedAt: existing ? now : null,
      lastAccessedAt: null,
    });

    await this.eventPublisher.publish({
      type: existing ? 'SessionTokenRegenerated' : 'SessionTokenGenerated',
      payload: {
        sessionId: saved.sessionId,
        tenantId: saved.tenantId,
        locationId: saved.locationId,
        tokenId: saved.id,
      },
    });

    return {
      ...saved,
      joinUrl: toJoinUrl(input.joinBaseUrl, saved.token),
    };
  }

  async validateToken(input: ValidateSessionTokenInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const normalizedToken = String(input.token || '').trim().toUpperCase();
    if (!isValidSessionToken(normalizedToken)) {
      throw new Error('Invalid session token format');
    }

    const record = await this.repository.findByToken(normalizedToken, input.tenantId, input.locationId);
    if (!record || record.status === 'REVOKED') {
      throw new Error('Session token is invalid');
    }

    const now = new Date();
    if (isExpired(record, now) || record.status === 'EXPIRED') {
      await this.repository.updateTokenStatus(record.id, record.tenantId, record.locationId, 'EXPIRED', now);
      await this.eventPublisher.publish({
        type: 'SessionTokenExpired',
        payload: {
          sessionId: record.sessionId,
          tenantId: record.tenantId,
          locationId: record.locationId,
          tokenId: record.id,
        },
      });
      throw new Error('Session token has expired');
    }

    const state = await this.sessionStateGateway.getSessionState(record.sessionId, record.tenantId, record.locationId);
    if (!state.exists) {
      throw new Error('Dining session not found');
    }
    if (!isJoinableSessionStatus(state.status)) {
      throw new Error('Session is closed or archived');
    }

    await this.repository.touchTokenAccess(record.id, record.tenantId, record.locationId, now);

    return {
      ...record,
      status: 'ACTIVE' as const,
      lastAccessedAt: now,
      sessionStatus: state.status,
    };
  }

  async joinSession(input: JoinSessionInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const role = normalizeSessionParticipantRole(input.role);
    const deviceId = String(input.deviceId || '').trim();

    if (!isValidDeviceId(deviceId)) {
      throw new Error('deviceId is invalid');
    }

    const validToken = await this.validateToken({
      token: input.token,
      tenantId: input.tenantId,
      locationId: input.locationId,
    });

    const existing = await this.repository.findParticipantByDevice(
      validToken.sessionId,
      input.tenantId,
      input.locationId,
      deviceId,
      role,
    );

    const now = new Date();

    if (existing && existing.status !== 'LEFT') {
      await this.repository.touchParticipant(existing.id, input.tenantId, input.locationId, now);

      if (existing.status === 'DISCONNECTED' || existing.status === 'IDLE') {
        const updated = await this.repository.updateParticipantStatus(
          existing.id,
          input.tenantId,
          input.locationId,
          'ACTIVE',
          null,
        );

        if (updated) {
          await this.eventPublisher.publish({
            type: 'ParticipantReconnected',
            payload: {
              sessionId: updated.sessionId,
              tenantId: updated.tenantId,
              locationId: updated.locationId,
              participantId: updated.id,
              deviceId: updated.deviceId,
              role: updated.role,
            },
          });
          return updated;
        }
      }

      return {
        ...existing,
        lastSeenAt: now,
      };
    }

    const participantLimit =
      Number.isInteger(input.participantLimit) && Number(input.participantLimit) > 0
        ? Number(input.participantLimit)
        : 25;

    const activeCount = await this.repository.countActiveParticipants(
      validToken.sessionId,
      input.tenantId,
      input.locationId,
    );
    if (activeCount >= participantLimit) {
      throw new Error('Participant limit exceeded for this session');
    }

    const created = await this.repository.createParticipant({
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: validToken.sessionId,
      role,
      participantType: role,
      displayName: input.displayName ?? null,
      deviceId,
      status: 'ACTIVE',
      permissions: resolveSessionParticipantPermissions(role),
      joinedBy: input.actorId ?? null,
      joinedAt: now,
      lastSeenAt: now,
      actorId: input.actorId ?? null,
    });

    await this.eventPublisher.publish({
      type: 'ParticipantJoined',
      payload: {
        sessionId: created.sessionId,
        tenantId: created.tenantId,
        locationId: created.locationId,
        participantId: created.id,
        deviceId: created.deviceId,
        role: created.role,
      },
    });

    return created;
  }

  async leaveSession(input: LeaveSessionInput) {
    assertTenantLocation(input.tenantId, input.locationId);

    const role = normalizeSessionParticipantRole(input.role);
    const deviceId = String(input.deviceId || '').trim();

    if (!isValidDeviceId(deviceId)) {
      throw new Error('deviceId is invalid');
    }

    const validToken = await this.validateToken({
      token: input.token,
      tenantId: input.tenantId,
      locationId: input.locationId,
    });

    const participant = await this.repository.findParticipantByDevice(
      validToken.sessionId,
      input.tenantId,
      input.locationId,
      deviceId,
      role,
    );

    if (!participant || participant.status === 'LEFT') {
      return null;
    }

    const now = new Date();
    const updated = await this.repository.updateParticipantStatus(
      participant.id,
      input.tenantId,
      input.locationId,
      'LEFT',
      now,
    );

    if (!updated) {
      return null;
    }

    await this.eventPublisher.publish({
      type: 'ParticipantLeft',
      payload: {
        sessionId: updated.sessionId,
        tenantId: updated.tenantId,
        locationId: updated.locationId,
        participantId: updated.id,
        deviceId: updated.deviceId,
        role: updated.role,
      },
    });

    return updated;
  }

  async regenerateToken(input: RegenerateSessionTokenInput) {
    return this.generateToken({
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: input.sessionId,
      createdBy: input.regeneratedBy,
      expiresAt: input.expiresAt,
      joinBaseUrl: input.joinBaseUrl,
    });
  }

  async getParticipants(input: GetParticipantsInput): Promise<SessionParticipantRecord[]> {
    assertTenantLocation(input.tenantId, input.locationId);
    return this.repository.listParticipants(
      input.sessionId,
      input.tenantId,
      input.locationId,
      input.includeLeft,
    );
  }

  async expireTokenForSession(sessionId: string, tenantId: string, locationId: string): Promise<void> {
    assertTenantLocation(tenantId, locationId);

    const token = await this.repository.findBySession(sessionId, tenantId, locationId);
    if (!token || token.status === 'EXPIRED' || token.status === 'REVOKED') {
      return;
    }

    const now = new Date();
    await this.repository.updateTokenStatus(token.id, tenantId, locationId, 'EXPIRED', now);
    await this.eventPublisher.publish({
      type: 'SessionTokenExpired',
      payload: {
        sessionId,
        tenantId,
        locationId,
        tokenId: token.id,
      },
    });
  }

  private async createUniqueToken(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = this.generateTokenString();
      if (!(await this.repository.isTokenValueInUse(candidate))) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique session token');
  }

  private generateTokenString(): string {
    const bytes = randomBytes(8).toString('hex').toUpperCase();
    const compact = bytes.slice(0, 12);
    return `${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8, 12)}`;
  }
}
