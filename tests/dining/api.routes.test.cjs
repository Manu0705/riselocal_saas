const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { sendSuccess } = require('../../apps/api/dist/shared/http/api-response');

const { DiningController } = require('../../apps/api/dist/modules/dining/presentation/dining.controller');

function stubController() {
  const stubs = [
    'createMenu',
    'updateMenu',
    'createCategory',
    'updateCategory',
    'deleteCategory',
    'createItem',
    'updateItem',
    'updateItemAvailability',
    'createItemVariant',
    'deleteVariant',
    'createItemAddon',
    'createItemModifier',
    'getPublicMenus',
  ];

  for (const method of stubs) {
    DiningController.prototype[method] = function patched(_req, res) {
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

test('POST /menus validates location requirement', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/dining.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/menus`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Dinner' }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /locationId is required/i);
  });
});

test('POST /categories validates menuId requirement', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/dining.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/categories`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-location-id': 'loc-1',
      },
      body: JSON.stringify({ tenantId: 'tenant-1', name: 'Soups' }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /menuId is required/i);
  });
});

test('DELETE /variants/:id validates itemId and menuId requirements', async () => {
  stubController();
  const routes = require('../../apps/api/dist/modules/dining/presentation/dining.routes').default;

  await withServer(() => routes, async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/variants/var-1`, {
      method: 'DELETE',
      headers: {
        'content-type': 'application/json',
        'x-location-id': 'loc-1',
      },
      body: JSON.stringify({ tenantId: 'tenant-1' }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.match(body.message, /itemId is required/i);
  });
});

test('Dining public routes expose GET /menus/public endpoint', async () => {
  const publicRoutes = require('../../apps/api/dist/modules/dining/presentation/dining.public.routes').default;
  const stack = publicRoutes.stack || [];
  const paths = stack.map((layer) => layer.route && layer.route.path).filter(Boolean);
  assert.ok(paths.includes('/menus/public'));
});
