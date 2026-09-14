#!/usr/bin/env node
/**
 * Run `prisma generate` from the monorepo root.
 *
 * Prisma 5.22 + pnpm fails to resolve @prisma/client when generate is invoked
 * with cwd=packages/database, but succeeds from the workspace root.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const schema = 'packages/database/prisma/schema.prisma';

const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'prisma', 'generate', `--schema=${schema}`],
  {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
