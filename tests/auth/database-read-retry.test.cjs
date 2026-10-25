const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getTransientDatabaseErrorCode,
  isTransientDatabaseError,
  withDatabaseReadRetry,
} = require('../../apps/api/dist/shared/database/database-read-retry');

test('database reads retry transient connectivity errors and return the recovered result', async () => {
  let attempts = 0;
  const result = await withDatabaseReadRetry(async () => {
    attempts += 1;
    if (attempts < 2) {
      const error = new Error("Can't reach database server");
      error.code = 'P1001';
      throw error;
    }
    return 'connected';
  }, 'test.findTenant');

  assert.equal(result, 'connected');
  assert.equal(attempts, 2);
});

test('database reads do not retry non-transient errors', async () => {
  let attempts = 0;
  await assert.rejects(
    () =>
      withDatabaseReadRetry(async () => {
        attempts += 1;
        throw Object.assign(new Error('Invalid credentials'), { code: 'P1000' });
      }, 'test.findTenant'),
    /Invalid credentials/,
  );
  assert.equal(attempts, 1);
});

test('persistent database connectivity failures exhaust the retry limit', async () => {
  let attempts = 0;
  await assert.rejects(
    () =>
      withDatabaseReadRetry(async () => {
        attempts += 1;
        throw Object.assign(new Error('Database unavailable'), { code: 'P1001' });
      }, 'test.findTenant'),
    (error) => getTransientDatabaseErrorCode(error) === 'P1001',
  );
  assert.equal(attempts, 3);
});

test('recognizes Neon connection messages without exposing the database host', () => {
  assert.equal(isTransientDatabaseError(new Error("Can't reach database server")), true);
  assert.equal(getTransientDatabaseErrorCode(new Error('Unrelated error')), null);
});
