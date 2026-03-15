#!/usr/bin/env node

const { spawn } = require('node:child_process');

const [, , envName, command, ...args] = process.argv;

if (!envName || !command) {
  console.error('Usage: node scripts/run-with-env.cjs <env> <command> [...args]');
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    APP_ENV: envName,
    NODE_ENV: envName === 'production' ? 'production' : 'development',
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
