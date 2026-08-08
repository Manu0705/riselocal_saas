const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { sendSuccess } = require('../../apps/api/dist/shared/http/api-response');

const { OrderRoundController } = require('../../apps/api/dist/modules/dining/presentation/order-round.controller');

function stubController() {
  const stubs = ['createRound', 'submitRound', 'getSessionOrders', 'cancelRound'];

  for (const method of stubs) {
    OrderRoundController.prototype[method] = function patched(_req, res) {
      return sendSuccess(res, 200, { ok: method });
    };
  }
}

async function withServer(routerFactory, fn) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 'user-1', tenantId: 'tenant-1', role: 'customer' };
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

test('POST /dining/orders/sessions/:sessionId/rounds validates location requirement', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/order-round.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/orders/sessions/session-1/rounds`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /locationId is required/i);
  });
});

test('POST /dining/orders/rounds/:roundId/submit accepts validation with tenant/location context', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/order-round.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/orders/rounds/round-1/submit`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-location-id': 'loc-1',
      },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
  });
});