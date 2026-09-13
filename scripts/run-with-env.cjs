#!/usr/bin/env node

const path = require('node:path');
const { spawn } = require('node:child_process');
const dotenv = require('dotenv');

const [, , envName, command, ...args] = process.argv;

if (!envName || !command) {
  console.error(
    'Usage: node scripts/run-with-env.cjs <env> <command> [...]',
  );
  process.exit(1);
}

// Load the root .env file.
const envFile = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envFile });

if (result.error) {
  console.error(`Failed to load environment file: ${envFile}`);
  console.error(result.error.message);
  process.exit(1);
}

// Pass the loaded environment to the child process.
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

child.on('error', (error) => {
  console.error('Failed to start command:', error);
  process.exit(1);
});