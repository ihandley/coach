#!/usr/bin/env bash
set -euo pipefail

mkdir -p \
  apps/job-coach-web/src/app \
  apps/job-coach-web/src/lib \
  apps/job-coach-web/src/server \
  packages/core/src/domain \
  packages/core/src/schemas \
  packages/db/src/schema \
  packages/db/src/repositories \
  packages/db/src/migrations \
  packages/db/src/seed \
  packages/ai/src \
  packages/documents/src \
  docs/architecture

touch \
  apps/job-coach-web/package.json \
  apps/job-coach-web/tsconfig.json \
  apps/job-coach-web/.env.example \
  packages/core/package.json \
  packages/core/tsconfig.json \
  packages/core/src/index.ts \
  packages/db/package.json \
  packages/db/tsconfig.json \
  packages/db/drizzle.config.ts \
  packages/db/src/client.ts \
  packages/db/src/index.ts \
  packages/db/src/schema/index.ts \
  packages/ai/package.json \
  packages/ai/tsconfig.json \
  packages/ai/src/index.ts \
  packages/documents/package.json \
  packages/documents/tsconfig.json \
  packages/documents/src/index.ts \
  docs/architecture/foundation.md \
  pnpm-workspace.yaml \
  turbo.json \
  tsconfig.base.json \
  vitest.workspace.ts \
  .env.example