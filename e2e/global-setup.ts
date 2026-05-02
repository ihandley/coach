import { execSync } from 'child_process';
import { readFileSync } from 'fs';

function loadLocalEnv() {
  const envFile = readFileSync('.env', 'utf8');

  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);

    process.env[key] ??= value;
  }
}

export default async function globalSetup() {
  console.log('Seeding database for E2E tests...');
  process.env.APP_ENV ??= 'development';
  loadLocalEnv();

  execSync('APP_ENV=development pnpm tsx packages/db/seed/e2e.ts', {
    stdio: 'inherit',
    env: process.env,
  });
}
