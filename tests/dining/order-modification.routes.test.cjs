const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { sendSuccess } = require('../../apps/api/dist/shared/http/api-response');

const { OrderModificationController } = require('../../apps/api/dist/modules/dining/presentation/order-modification.controller');

function stubController() {
  const stubs = ['request', 'approve', 'reject', 'cancelItem', 'history'];

  for (const method of stubs) {
    OrderModificationController.prototype[method] = function patched(_req, res) {
      return sendSuccess(res, 200, { ok: method });
    };
  }
}

async function withServer(routerFactory, fn) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 'user-1', tenantId: 'tenant-1', role: 'waiter' };
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

test('POST /dining/orders/:orderId/modifications validates reason requirement', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/order-modification.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/orders/order-1/modifications`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-location-id': 'loc-1',
      },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /reason is required/i);
  });
});

test('GET /dining/orders/:orderId/modifications accepts tenant/location context', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/order-modification.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/orders/order-1/modifications`, {
      method: 'GET',
      headers: {
        'x-location-id': 'loc-1',
      },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
  });
});
