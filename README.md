# Job Coach

Job Coach is a workflow-driven application for importing jobs, evaluating fit, tailoring resumes, drafting cover letters, and exporting application materials.

## Canonical operating model

This repository is the canonical product runtime for Job Coach.

The rebuilt system is:

- application-first
- database-backed
- workflow-driven
- deterministic where practical
- testable through normal app and package test suites

OpenCode is **not** the runtime engine for the product.

OpenCode may still be useful for:

- legacy reference material
- migration inventory
- developer tooling outside the product runtime

But the product execution model now lives in this repository.

## What replaced the old model

The previous OpenCode-centric model relied on:

- agents
- skills
- command routing
- prompt-driven orchestration
- mutable file-based state

The rebuilt Job Coach replaces those patterns with:

- typed core packages
- database-backed repositories
- explicit application services
- persisted workflow runs and steps
- API routes and server modules
- deterministic export and artifact tracking

See:

- `docs/migration-from-opencode.md`
- `docs/workflows.md`
- `docs/exports.md`

## Repository layout

```txt
apps/job-coach-web/      Next.js application surface
packages/core/           Core domain logic and workflow primitives
packages/db/             Persistence, repositories, and migrations
docs/                    Architecture, workflow, export, and migration docs
scripts/                 Repo automation and maintenance scripts
.ai/                     AI workflow support docs for development
```

## Architecture summary

The rebuilt Job Coach is organized around a few explicit layers:

### 1. Core domain logic

`packages/core` contains:

- domain types
- pure application logic
- export service composition
- workflow runner and queue primitives

### 2. Persistence

`packages/db` contains:

- repositories
- migration SQL
- database-backed adapters
- storage of canonical structured data

### 3. App/server layer

`apps/job-coach-web/src/server` contains:

- server composition
- workflow orchestration wiring
- export wiring
- evaluation entry points
- app-facing service composition

### 4. API layer

`apps/job-coach-web/src/app/api` contains:

- HTTP routes
- request validation
- response mapping
- workflow visibility endpoints

### 5. Documentation and developer workflow

Docs and contributor guidance live in:

- `README.md`
- `AGENT.md`
- `docs/*`
- `.ai/*`

## Current critical paths

The new app supports explicit, bounded flows such as:

- import job from URL
- score job fit
- generate tailored resume
- generate cover letter
- export resume / cover letter / application packet
- run multi-step workflows with persisted run history

## Local development

### Install

```bash
pnpm install
```

### Run tests

```bash
pnpm --filter @coach/core exec vitest run
pnpm --filter @coach/db exec vitest run
pnpm --filter job-coach-web exec vitest run
```

### Typecheck

```bash
pnpm --filter @coach/core typecheck
pnpm --filter @coach/db typecheck
pnpm --filter job-coach-web typecheck
```

### Run the web app

Use the normal app workflow for the Next.js app in `apps/job-coach-web`.

If additional environment setup is required, treat the application code and repository docs as the source of truth rather than legacy OpenCode setup.

## Testing and CI expectations

The rebuilt path should be validated through:

- package tests in `packages/core`
- package tests in `packages/db`
- application tests in `apps/job-coach-web`
- typechecking across the active packages
- CI coverage for the new app path rather than legacy agent execution

## Adding new AI-backed features safely

When adding AI-backed behavior:

- keep the workflow explicit
- store canonical state in structured persistence
- validate AI output before persisting
- prefer bounded prompts or evaluators over open-ended routing
- keep retries and failure handling visible
- ensure tests cover the new path

Do not reintroduce:

- prompt-based global routing
- mutable JSON files as canonical state
- hidden agent behavior as product infrastructure

## OpenCode status

OpenCode remains relevant only as a legacy/dev-tooling reference.

It is useful for:

- migration inventory
- understanding what the old system did
- identifying terminology that may still appear in scripts or docs

It is not the product runtime and should not be treated as the source of truth for current application behavior.
