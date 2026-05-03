# Migration from OpenCode

This document explains how the rebuilt Job Coach replaces the earlier OpenCode-centric runtime model.

## Summary

The current Job Coach product does **not** run on OpenCode agents, skills, commands, or prompt routing.

The canonical product runtime now lives in this repository:

- `apps/job-coach-web`
- `packages/core`
- `packages/db`

OpenCode may still be used as a developer tool or migration reference, but it is not the execution model for the product.

## Legacy source

The legacy OpenCode configuration lived in `ihandley/opencode-config`.

That repository defines an OpenCode setup including:

- `.opencode/agents`
- `.opencode/skills`
- `.opencode/commands`
- `.opencode/instructions`
- `opencode.json`
- OpenCode-specific setup such as `OPENCODE_CONFIG_DIR` and `/connect`

Those concepts are useful for inventory and migration context, but they are not the canonical model for the rebuilt app.

## Canonical replacement mapping

| Legacy OpenCode concept    | New Job Coach replacement                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| Agent                      | App/server orchestration + explicit workflows                                              |
| Skill                      | Typed service/module in `packages/core`, `packages/db`, or `apps/job-coach-web/src/server` |
| Command                    | Normal scripts, tests, or app/API entry points                                             |
| Prompt routing             | Explicit workflow steps and application logic                                              |
| File-based canonical state | Database-backed structured persistence                                                     |
| Hidden runtime behavior    | Visible server composition and API routes                                                  |
| Ad hoc artifact creation   | Deterministic export pipeline with tracked artifacts                                       |

## What is retired

The rebuilt product retires these as product-runtime assumptions:

- OpenCode as the runtime engine
- skill discovery as a product execution mechanism
- prompt-based global routing
- mutable file-based canonical state for core product entities
- treating agent prompts as the source of truth for application behavior

## What is retained

OpenCode may still be retained for limited purposes:

- historical reference for what the old system did
- migration inventory
- developer tooling not used by the production app runtime
- personal AI workflow support outside the app itself

## Current source of truth

The current source of truth is the rebuilt application repository.

### Application runtime

- `apps/job-coach-web`

### Core business logic

- `packages/core`

### Persistence and migrations

- `packages/db`

### Durable documentation

- `README.md`
- `AGENT.md`
- `docs/workflows.md`
- `docs/exports.md`
- this document

## Current operating model

The rebuilt Job Coach is:

- workflow-driven
- application-first
- database-backed
- explicit about state transitions
- bounded in AI-assisted behavior
- testable through ordinary test suites and typecheck

## Current workflow examples

Examples of explicit workflows now supported by the app:

- import job from URL → save → score fit
- generate tailored resume → generate cover letter → export packet

Each workflow records:

- workflow run status
- step status
- retry behavior
- error details
- queryable run history

## Developer workflow changes

Developers should now work from:

- issue branch
- tests
- typed modules
- API routes
- workflow orchestration
- repo docs

Developers should not need to read legacy OpenCode prompts to understand the product runtime.

## How to evaluate future changes

When adding new behavior, ask:

1. Is the workflow explicit?
2. Is canonical state persisted in structured storage?
3. Is failure visible and debuggable?
4. Is retry behavior bounded?
5. Is the new path covered by tests and typecheck?
6. Does this avoid reintroducing OpenCode runtime assumptions?

If the answer to any of those is no, the change likely needs refinement.

## Migration decision

OpenCode is now a **legacy/dev-tooling reference**, not the Job Coach runtime.

The rebuilt application in this repository is the canonical operating model going forward.
