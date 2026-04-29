# Job Coach Environments

Job Coach uses two explicit app environments.

## Development

Used for disposable data, reset workflows, test data, and local feature work.

Command:

pnpm dev:job-coach

Uses Keychain secrets:

coach_dev_SUPABASE_URL
coach_dev_SUPABASE_SERVICE_ROLE_KEY

## Production-like personal environment

Used for real job tracking data. Do not reset casually.

Command:

pnpm prd:job-coach

Uses Keychain secrets:

coach_prd_SUPABASE_URL
coach_prd_SUPABASE_SERVICE_ROLE_KEY

## Rules

- APP_ENV=development is safe to reset
- APP_ENV=production is real personal data
- Destructive scripts must refuse to run unless APP_ENV=development
- Current Supabase instance = PRD
- New Supabase instance = DEV
