import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
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
  },
});
