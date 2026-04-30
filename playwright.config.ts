import { defineConfig } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));
const envFilePath = join(rootDir, '.env');

function parseDotEnv(filePath: string) {
  const raw = readFileSync(filePath, { encoding: 'utf8' });
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        const key = line.slice(0, index).trim();
        let value = line.slice(index + 1).trim();

        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }

        if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }

        return [key, value];
      }),
  );
}

const rootEnv = parseDotEnv(envFilePath);

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: {
    command: 'pnpm --filter job-coach-web dev',
    cwd: join(rootDir, 'apps', 'job-coach-web'),
    port: 3000,
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      APP_ENV: 'development',
      NEXT_PUBLIC_APP_ENV: 'development',
      PORT: '3000',
      ...rootEnv,
    },
  },
});
