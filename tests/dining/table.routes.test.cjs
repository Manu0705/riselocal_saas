const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { sendSuccess } = require('../../apps/api/dist/shared/http/api-response');

const { TableController } = require('../../apps/api/dist/modules/dining/presentation/table.controller');

function stubController() {
  const stubs = ['list', 'get', 'updateStatus', 'assignWaiter', 'clean', 'maintenance', 'restoreMaintenance'];

  for (const method of stubs) {
    TableController.prototype[method] = function patched(_req, res) {
      return sendSuccess(res, 200, { ok: method });
    };
  }
}

async function withServer(routerFactory, fn) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 'user-1', tenantId: 'tenant-1', role: 'staff' };
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

test('GET /dining/tables validates location requirement', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/table.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/tables`, {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /locationId is required/i);
  });
});

test('PATCH /dining/tables/:id/status validates status requirement', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/table.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/tables/table-1/status`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-location-id': 'loc-1',
      },
      body: JSON.stringify({ tenantId: 'tenant-1' }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /status is required/i);
  });
});