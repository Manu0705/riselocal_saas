const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { sendSuccess } = require('../../apps/api/dist/shared/http/api-response');

const { SessionTokenController } = require('../../apps/api/dist/modules/dining/presentation/session-token.controller');

function stubSessionTokenController() {
  const stubs = ['generate', 'validate', 'join', 'leave', 'regenerate', 'getParticipants'];

  for (const method of stubs) {
    SessionTokenController.prototype[method] = function patched(_req, res) {
      return sendSuccess(res, 200, { ok: method });
    };
  }
}

async function withServer(routerFactory, fn) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 'user-1', tenantId: 'tenant-1', role: 'owner' };
    next();
  });
  app.use(routerFactory());

  const server = await new Promise((resolve) => {
    const running = app.listen(0, () => resolve(running));
  });

  try {
    const port = server.address().port;
    await fn(port);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

test('POST /dining/session-token/generate validates sessionId', async () => {
  stubSessionTokenController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/session-token.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/session-token/generate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-location-id': 'loc-1',
      },
      body: JSON.stringify({ tenantId: 'tenant-1' }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /sessionId is required/i);
  });
});

test('POST /dining/session-token/join validates device and role', async () => {
  stubSessionTokenController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/session-token.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/session-token/join`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-location-id': 'loc-1',
      },
      body: JSON.stringify({ tenantId: 'tenant-1', token: 'ABCD-EFGH-IJKL' }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /role is required/i);
  });
});

test('Session token public routes expose validate/join/leave endpoints', async () => {
  const publicRoutes = require('../../apps/api/dist/modules/dining/presentation/session-token.public.routes').default;
  const stack = publicRoutes.stack || [];
  const paths = stack.map((layer) => layer.route && layer.route.path).filter(Boolean);

  assert.ok(paths.includes('/dining/session-token/validate'));
  assert.ok(paths.includes('/dining/session-token/join'));
  assert.ok(paths.includes('/dining/session-token/leave'));
});
