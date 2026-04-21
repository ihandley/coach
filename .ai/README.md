# AI Project Context

This folder stores durable, AI-readable project context so new ChatGPT sessions can pick up work faster and with less drift.

## Recommended workflow

1. Keep `project.md` accurate.
2. Update `current.md` at the end of each session.
3. Create one stage file per phase in `stages/`.
4. Create one issue file per task in `issues/`.
5. Use `scripts/ai-context.sh` to compose a prompt bundle for a new session.

## Core files

- `project.md` - stable project summary and goals
- `current.md` - current working state and next step
- `architecture.md` - codebase structure and system design
- `roadmap.md` - planned, active, completed work
- `decisions.md` - important technical decisions and rationale

## Naming suggestions

- Stages: `01-repo-setup.md`, `08-phone-verification.md`
- Issues: `issue-008-phone-verification.md`

## At the start of each session

Follow AGENT.md strictly.

Use these files as source of truth:
- .ai/project.md
- .ai/current.md
- relevant stage file

Use the active GitHub issue as the task contract.

Current execution context:
- branch: <branch-name>
- current task: <what you are doing>
- next step: <immediate next step>
- constraints: step-by-step, TDD

Do not assume work is complete unless stated in these sources.
Prefer existing workflows and patterns in the repo.

## At the end of each session

## Session Handoff
Branch: feature/phone-verification-gate

Completed:
- Added phone_verified field
- Added initial schema migration
- Added first auth gating tests

Current status:
- Tests for middleware behavior still need to be written
- UI flow not implemented yet

Next step:
- Write failing tests for marketplace route protection

Open question:
- Middleware vs server component guard