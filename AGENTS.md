# AGENTS.md

Durable repo-wide rules for AI assistants working in Job Coach.

## Source of Truth

Use these in order:

1. GitHub issue requirements and acceptance criteria
2. Current repo code on the active branch
3. Draft PR and pushed commits
4. Durable docs in `README.md`, `.ai/`, and `docs/`

Do not rely on `.ai/current.md` as authoritative session state.

## Core Rules

- Make the smallest viable change that satisfies the issue
- Keep diffs narrow and reviewable
- Inspect only files relevant to the requested change
- Reuse existing patterns and components
- Preserve existing behavior unless the issue requires changing it
- Do not refactor, reorganize, or reformat unrelated files
- Do not infer extra features beyond the issue
- Stop and explain if scope expands significantly

## Architecture Boundaries

- `apps/job-coach-web/` = app UI, API routes, and app-facing server composition
- `packages/core/` = domain logic, workflow primitives, and reusable services
- `packages/db/` = repositories, migrations, persistence adapters, and DB-backed services
- `docs/` = architecture, workflows, migration, and contributor docs
- `scripts/` = automation and maintenance utilities
- `.ai/` = AI workflow support docs

Respect these boundaries.

## Product Constraints

- Structured database-backed entities are the source of truth
- Do not invent fields or discard existing data
- Prefer additive updates over destructive changes
- Do not introduce breaking schema changes unless explicitly requested
- Do not reintroduce legacy OpenCode runtime assumptions as product architecture
- For dev fixtures, `packages/db/seed/e2e.ts` is authoritative
- Use Kysely-style data access where that pattern already exists

## Issue Workflow

- Work from a GitHub issue unless explicitly told otherwise
- Use `./scripts/issue-checkpoint.sh <issue_number>` when starting issue work
- Confirm the issue branch and draft PR exist before coding
- Work in small checkpoints
- Use commit format: `issue-<n>: <checkpoint description>`
- Use the draft PR as the handoff/review surface

## Validation

- Prefer targeted validation over exhaustive validation
- Do not run the full test suite by default
- Run only checks directly related to changed files or behavior
- Use typecheck or targeted unit tests for shared logic, schemas, repositories, and API contracts
- Use Playwright only when UI flows changed or the issue explicitly requires it
- Avoid repeated reruns of the same failing command without a code change
- If validation is skipped, state what was skipped and why

## Token Efficiency

- Do not restate issue descriptions unless asked
- Do not summarize unrelated files
- Do not print large file contents unless explicitly requested
- Avoid broad repository scans
- Keep progress updates short
- Stop when acceptance criteria are satisfied, targeted validation is done or intentionally skipped, and remaining risks are noted
