const test = require('node:test');
const assert = require('node:assert/strict');

const { SessionTokenService } = require('../../apps/api/dist/modules/dining/application/services/session-token.service');

class InMemorySessionTokenRepository {
  constructor() {
    this.tokens = [];
    this.participants = [];
  }

  tokenKey(token, tenantId, locationId) {
    return `${tenantId}:${locationId}:${token}`;
  }

  async findBySession(sessionId, tenantId, locationId) {
    const found = this.tokens.find(
      (entry) => entry.sessionId === sessionId && entry.tenantId === tenantId && entry.locationId === locationId,
    );
    return found || null;
  }

  async findByToken(token, tenantId, locationId) {
    const normalized = String(token || '').trim().toUpperCase();
    const found = this.tokens.find(
      (entry) => entry.token === normalized && entry.tenantId === tenantId && entry.locationId === locationId,
    );
    return found || null;
  }

  async isTokenValueInUse(token) {
    const normalized = String(token || '').trim().toUpperCase();
    return this.tokens.some((entry) => entry.token === normalized);
  }

  async upsertToken(input) {
    const now = new Date();
    if (input.id) {
      const index = this.tokens.findIndex((entry) => entry.id === input.id);
      if (index >= 0) {
        this.tokens[index] = {
          ...this.tokens[index],
          token: input.token.toUpperCase(),
          status: input.status,
          expiresAt: input.expiresAt,
          regeneratedAt: input.regeneratedAt || null,
          lastAccessedAt: input.lastAccessedAt || null,
        };
        return this.tokens[index];
      }
    }

    const created = {
      id: input.id || `tok-${this.tokens.length + 1}`,
      tenantId: input.tenantId,
      locationId: input.locationId,
      sessionId: input.sessionId,
      token: input.token.toUpperCase(),
      status: input.status,
      expiresAt: input.expiresAt,
      createdAt: now,
      createdBy: input.createdBy || null,
      lastAccessedAt: input.lastAccessedAt || null,
      regeneratedAt: input.regeneratedAt || null,
    };

    this.tokens.push(created);
    return created;
  }

  async updateTokenStatus(tokenId, tenantId, locationId, status, lastAccessedAt) {
    const index = this.tokens.findIndex(
      (entry) => entry.id === tokenId && entry.tenantId === tenantId && entry.locationId === locationId,
    );
    if (index >= 0) {
      this.tokens[index] = {
        ...this.tokens[index],
        status,
        lastAccessedAt: lastAccessedAt || null,
      };
    }
  }

  async touchTokenAccess(tokenId, tenantId, locationId, lastAccessedAt) {
    const index = this.tokens.findIndex(
      (entry) => entry.id === tokenId && entry.tenantId === tenantId && entry.locationId === locationId,
    );
    if (index >= 0) {
      this.tokens[index] = {
        ...this.tokens[index],
        lastAccessedAt,
      };
    }
  }

  async findParticipantByDevice(sessionId, tenantId, locationId, deviceId, role) {
    const found = this.participants.find(
      (entry) =>
        entry.sessionId === sessionId &&
        entry.tenantId === tenantId &&
        entry.locationId === locationId &&
        entry.deviceId === deviceId &&
        entry.role === role,
    );

    return found || null;
  }

  async countActiveParticipants(sessionId, tenantId, locationId) {
    return this.participants.filter(
      (entry) =>
        entry.sessionId === sessionId &&
        entry.tenantId === tenantId &&
        entry.locationId === locationId &&
        ['JOINING', 'ACTIVE', 'IDLE', 'DISCONNECTED'].includes(entry.status),
    ).length;
  }

  async createParticipant(input) {
    const created = {
      id: `p-${this.participants.length + 1}`,
      ...input,
      leftAt: null,
    };
    this.participants.push(created);
    return created;
  }

  async updateParticipantStatus(participantId, tenantId, locationId, status, leftAt) {
    const index = this.participants.findIndex(
      (entry) => entry.id === participantId && entry.tenantId === tenantId && entry.locationId === locationId,
    );
    if (index < 0) return null;

    this.participants[index] = {
      ...this.participants[index],
      status,
      leftAt: leftAt || null,
      lastSeenAt: new Date(),
    };

    return this.participants[index];
  }

  async touchParticipant(participantId, tenantId, locationId, lastSeenAt) {
    const index = this.participants.findIndex(
      (entry) => entry.id === participantId && entry.tenantId === tenantId && entry.locationId === locationId,
    );
    if (index >= 0) {
      this.participants[index] = {
        ...this.participants[index],
        lastSeenAt,
      };
    }
  }

  async listParticipants(sessionId, tenantId, locationId, includeLeft) {
    return this.participants.filter(
      (entry) =>
        entry.sessionId === sessionId &&
        entry.tenantId === tenantId &&
        entry.locationId === locationId &&
        (includeLeft ? true : entry.status !== 'LEFT'),
    );
  }
}

class FakePublisher {
  constructor() {
    this.events = [];
  }

  async publish(event) {
    this.events.push(event);
  }
}

class FakeSessionStateGateway {
  constructor() {
    this.states = new Map();
  }

  key(sessionId, tenantId, locationId) {
    return `${tenantId}:${locationId}:${sessionId}`;
  }

  setState(sessionId, tenantId, locationId, status, exists = true) {
    this.states.set(this.key(sessionId, tenantId, locationId), { exists, status });
  }

  async getSessionState(sessionId, tenantId, locationId) {
    return this.states.get(this.key(sessionId, tenantId, locationId)) || { exists: false, status: 'ARCHIVED' };
  }
}

test('generates active token for an active session', async () => {
  const repo = new InMemorySessionTokenRepository();
  const publisher = new FakePublisher();
  const stateGateway = new FakeSessionStateGateway();
  stateGateway.setState('s-1', 't-1', 'l-1', 'ACTIVE');

  const service = new SessionTokenService(repo, publisher, stateGateway);

  const result = await service.generateToken({
    sessionId: 's-1',
    tenantId: 't-1',
    locationId: 'l-1',
    createdBy: 'u-1',
    joinBaseUrl: 'https://tenant.riselocal.in',
  });

  assert.equal(result.status, 'ACTIVE');
  assert.match(result.token, /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(result.joinUrl.endsWith(`/join/${result.token}`), true);
  assert.equal(publisher.events[0].type, 'SessionTokenGenerated');
});

test('duplicate join request from same role/device returns existing participant', async () => {
  const repo = new InMemorySessionTokenRepository();
  const publisher = new FakePublisher();
  const stateGateway = new FakeSessionStateGateway();
  stateGateway.setState('s-1', 't-1', 'l-1', 'ACTIVE');

  const service = new SessionTokenService(repo, publisher, stateGateway);

  const token = await service.generateToken({
    sessionId: 's-1',
    tenantId: 't-1',
    locationId: 'l-1',
    createdBy: 'u-1',
  });

  const first = await service.joinSession({
    token: token.token,
    role: 'CUSTOMER',
    deviceId: 'device-abc-001',
    tenantId: 't-1',
    locationId: 'l-1',
  });

  const second = await service.joinSession({
    token: token.token,
    role: 'CUSTOMER',
    deviceId: 'device-abc-001',
    tenantId: 't-1',
    locationId: 'l-1',
  });

  assert.equal(first.id, second.id);
  assert.equal(repo.participants.length, 1);
  assert.equal(publisher.events.filter((event) => event.type === 'ParticipantJoined').length, 1);
});

test('leave marks participant as LEFT', async () => {
  const repo = new InMemorySessionTokenRepository();
  const publisher = new FakePublisher();
  const stateGateway = new FakeSessionStateGateway();
  stateGateway.setState('s-1', 't-1', 'l-1', 'ACTIVE');

  const service = new SessionTokenService(repo, publisher, stateGateway);

  const token = await service.generateToken({
    sessionId: 's-1',
    tenantId: 't-1',
    locationId: 'l-1',
    createdBy: 'u-1',
  });

  await service.joinSession({
    token: token.token,
    role: 'WAITER',
    deviceId: 'device-waiter-9',
    tenantId: 't-1',
    locationId: 'l-1',
  });

  const left = await service.leaveSession({
    token: token.token,
    role: 'WAITER',
    deviceId: 'device-waiter-9',
    tenantId: 't-1',
    locationId: 'l-1',
  });

  assert.ok(left);
  assert.equal(left.status, 'LEFT');
  assert.equal(publisher.events.at(-1).type, 'ParticipantLeft');
});

test('closed session rejects joining', async () => {
  const repo = new InMemorySessionTokenRepository();
  const publisher = new FakePublisher();
  const stateGateway = new FakeSessionStateGateway();
  stateGateway.setState('s-1', 't-1', 'l-1', 'CLOSED');

  const service = new SessionTokenService(repo, publisher, stateGateway);

  await assert.rejects(
    () =>
      service.generateToken({
        sessionId: 's-1',
        tenantId: 't-1',
        locationId: 'l-1',
        createdBy: 'u-1',
      }),
    /closed or archived/i,
  );
});
