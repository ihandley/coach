import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('Seeding database for E2E tests...');

  execSync('pnpm tsx packages/db/seed/e2e.ts', {
    stdio: 'inherit',
  });
}
