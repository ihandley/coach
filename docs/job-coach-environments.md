# Job Coach Environments

Job Coach uses two explicit app environments. Keep them separate so normal development can
reset data freely without touching stable personal production-like data.

## Development

Used for disposable data, reset workflows, test data, and local feature work. This
environment should point at the local Supabase instance.

Start the development app:

```bash
make dev
```

or:

```bash
pnpm dev:job-coach
```

Reset development data:

```bash
pnpm db:reset:dev
```

The development defaults are:

```bash
APP_ENV=development
NEXT_PUBLIC_APP_ENV=development
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<local Supabase service role key>
```

## Production-like personal environment

Used for real job tracking data. Do not reset casually. This environment should point at a
separate Supabase project or database from development.

Create this ignored local file:

```txt
apps/job-coach-web/.env.production.local
```

with:

```bash
APP_ENV=production
NEXT_PUBLIC_APP_ENV=production
JOB_COACH_APP_URL=http://localhost:3001
SUPABASE_URL=<personal production-like Supabase URL>
SUPABASE_SERVICE_ROLE_KEY=<personal production-like service role key>
OPENAI_API_KEY=<OpenAI API key>
```

Both production-like commands explicitly load `apps/job-coach-web/.env.production.local`,
force `APP_ENV=production`, `NEXT_PUBLIC_APP_ENV=production`, `JOB_COACH_APP_URL=http://localhost:3001`,
`NODE_ENV=production`, and `PORT=3001`, then validate that `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and `OPENAI_API_KEY` are present.

Build and start the production-like app:

```bash
make build-prd
make prd
```

or:

```bash
pnpm build:job-coach:prd
pnpm prd:job-coach
```

## Guardrails

- `APP_ENV=development` is safe to reset.
- `APP_ENV=production` is stable personal data.
- `pnpm db:reset` and `pnpm db:reset:dev` only run with `APP_ENV=development`.
- `pnpm db:reset:prd` is emergency-only. It refuses to run unless `CONFIRM_PRODUCTION_RESET`
  is set to `RESET_PRODUCTION_JOB_COACH_DATA`.
- Do not store real secrets in tracked env files.

## Backup and Export

Before running risky production-like maintenance, export current data:

```bash
pnpm db:export:prd
```

Exports are written to the ignored `backups/` directory. Keep important backups outside
the repository as well.

## Future Hosted Path

The first stable environment is local-only. A hosted deployment should add:

- hosted application runtime
- production Supabase project management
- authentication and user isolation
- scheduled backups
- deployment-specific secret management
