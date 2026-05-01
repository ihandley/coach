import { defineConfig } from '@playwright/test';
import { readFileSync } from 'fs';

function loadLocalEnv() {
  try {
    const envFile = readFileSync('.env', 'utf8');
    const env: Record<string, string> = {};

    for (const line of envFile.split('\n')) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separator = trimmed.indexOf('=');

      if (separator === -1) {
        continue;
      }

      env[trimmed.slice(0, separator)] = trimmed.slice(separator + 1);
    }

    return env;
  } catch {
    return {};
  }
}

const localEnv = loadLocalEnv();

export default defineConfig({
  testDir: './apps/job-coach-web/tests',
  timeout: 30000,

  globalSetup: require.resolve('./e2e/global-setup'),

  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },

  webServer: {
    command: 'pnpm dev:job-coach',
    port: 3000,
    reuseExistingServer: true,
    env: {
      ...localEnv,
      APP_ENV: 'development',
      NEXT_PUBLIC_APP_ENV: 'development',
    },
  },
});
