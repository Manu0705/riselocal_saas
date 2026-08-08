const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { sendSuccess } = require('../../apps/api/dist/shared/http/api-response');

const { CartController } = require('../../apps/api/dist/modules/dining/presentation/cart.controller');

function stubController() {
  const stubs = ['getActive', 'addItem', 'updateItem', 'removeItem', 'submit'];

  for (const method of stubs) {
    CartController.prototype[method] = function patched(_req, res) {
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

test('GET /dining/cart/sessions/:sessionId/cart validates session requirement', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/cart.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/cart/sessions/session-1/cart`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'x-location-id': 'loc-1',
      },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
  });
});

test('POST /dining/cart/sessions/:sessionId/cart/items validates menuItemId and quantity', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/cart.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/cart/sessions/session-1/cart/items`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-location-id': 'loc-1',
      },
      body: JSON.stringify({ sessionId: 'session-1', quantity: 2 }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /menuItemId is required/i);
  });
});