const test = require('node:test');
const assert = require('node:assert/strict');

const { SessionParticipantService } = require('../../apps/api/dist/modules/dining/application/services/session-participant.service');

class InMemoryParticipantRepository {
  constructor() {
    this.sessions = [
      {
        id: 'session-1',
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        status: 'ACTIVE',
        assignedWaiterId: null,
      },
    ];
    this.participants = [];
  }

  async findSessionById(sessionId, tenantId, locationId) {
    return (
      this.sessions.find(
        (entry) => entry.id === sessionId && entry.tenantId === tenantId && entry.locationId === locationId,
      ) || null
    );
  }

  async findParticipantById(participantId, tenantId, locationId) {
    return (
      this.participants.find(
        (entry) => entry.id === participantId && entry.tenantId === tenantId && entry.locationId === locationId,
      ) || null
    );
  }

  async findActiveParticipantByActor(sessionId, tenantId, locationId, actorId, participantType) {
    return (
      this.participants.find(
        (entry) =>
          entry.sessionId === sessionId &&
          entry.tenantId === tenantId &&
          entry.locationId === locationId &&
          entry.actorId === actorId &&
          entry.participantType === participantType &&
          ['JOINING', 'ACTIVE', 'IDLE', 'DISCONNECTED'].includes(entry.status),
      ) || null
    );
  }

  async createParticipant(input) {
    const created = {
      id: `participant-${this.participants.length + 1}`,
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
    if (index < 0) {
      return null;
    }

    this.participants[index] = {
      ...this.participants[index],
      status,
      leftAt,
      lastSeenAt: leftAt,
    };

    return this.participants[index];
  }

  async listParticipants(sessionId, tenantId, locationId, includeLeft = false) {
    return this.participants.filter(
      (entry) =>
        entry.sessionId === sessionId &&
        entry.tenantId === tenantId &&
        entry.locationId === locationId &&
        (includeLeft ? true : !['LEFT', 'REMOVED'].includes(entry.status)),
    );
  }

  async assignWaiter(sessionId, tenantId, locationId, waiterId) {
    const index = this.sessions.findIndex(
      (entry) => entry.id === sessionId && entry.tenantId === tenantId && entry.locationId === locationId,
    );

    if (index < 0) {
      return null;
    }

    this.sessions[index] = {
      ...this.sessions[index],
      assignedWaiterId: waiterId,
    };

    return this.sessions[index];
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

test('SessionParticipantService joins waiter and emits waiter-specific event', async () => {
  const repository = new InMemoryParticipantRepository();
  const publisher = new FakePublisher();
  const service = new SessionParticipantService(repository, publisher);

  const participant = await service.joinParticipant({
    sessionId: 'session-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    actorId: 'waiter-1',
    actorRole: 'waiter',
    participantType: 'WAITER',
    displayName: 'John',
    deviceId: 'device-waiter-1',
  });

  assert.equal(participant.participantType, 'WAITER');
  assert.equal(Array.isArray(participant.permissions), true);
  assert.equal(participant.permissions.length > 0, true);
  assert.equal(publisher.events.some((event) => event.type === 'ParticipantJoined'), true);
  assert.equal(publisher.events.some((event) => event.type === 'WaiterJoinedSession'), true);
});

test('SessionParticipantService allows manager ownership transfer and participant removal', async () => {
  const repository = new InMemoryParticipantRepository();
  const publisher = new FakePublisher();
  const service = new SessionParticipantService(repository, publisher);

  const target = await service.joinParticipant({
    sessionId: 'session-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    actorId: 'waiter-2',
    actorRole: 'waiter',
    participantType: 'WAITER',
    deviceId: 'device-waiter-2',
  });

  const transfer = await service.transferOwnership({
    sessionId: 'session-1',
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    actorId: 'manager-1',
    actorRole: 'manager',
    participantId: target.id,
  });

  assert.equal(transfer.assignedWaiterId, 'waiter-2');

  const removed = await service.leaveParticipant({
    sessionId: 'session-1',
    participantId: target.id,
    tenantId: 'tenant-1',
    locationId: 'loc-1',
    actorId: 'manager-1',
    actorRole: 'manager',
  });

  assert.equal(removed.status, 'REMOVED');
  assert.equal(publisher.events.some((event) => event.type === 'SessionOwnershipTransferred'), true);
  assert.equal(publisher.events.some((event) => event.type === 'ParticipantLeftSession'), true);
});
