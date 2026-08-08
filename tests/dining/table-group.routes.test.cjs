const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { sendSuccess } = require('../../apps/api/dist/shared/http/api-response');
const { TableGroupController } = require('../../apps/api/dist/modules/dining/presentation/table-group.controller');

function stubController() {
  const methods = ['requestMerge', 'approveMerge', 'releaseGroup'];
  for (const method of methods) {
    TableGroupController.prototype[method] = function patched(_req, res) {
      return sendSuccess(res, 200, { ok: method });
    };
  }
}

async function withServer(routerFactory, fn) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 'user-1', tenantId: 'tenant-1', role: 'reception' };
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

test('POST /dining/table-groups/merge validates table list and reason', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/table-group.routes').default;
  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/table-groups/merge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-location-id': 'loc-1' },
      body: JSON.stringify({ reason: 'Large group' }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /tables is required/i);
  });
});

test('POST /dining/table-groups/groups/:groupId/release accepts tenant/location context', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/table-group.routes').default;
  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/dining/table-groups/groups/group-1/release`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-location-id': 'loc-1' },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
  });
});
