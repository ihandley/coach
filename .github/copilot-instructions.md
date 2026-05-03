# Copilot / Agent Instructions

Use AGENTS.md as the primary repository guidance.

Key rules:
- Keep changes small and issue-scoped.
- Use origin/main as the source of truth for existing behavior.
- Do not restore older implementations from stale branches.
- Do not modify unrelated files.
- Do not refactor unless explicitly requested.
- Do not reintroduce removed UI or workflows.
- If a change touches more than ~10 files, stop and reassess scope.
- Preserve job import parsing, structured/raw job views, and ranked API behavior unless the issue explicitly targets them.
- Run validation before handoff:
  - pnpm lint
  - pnpm format
  - pnpm typecheck
  - pnpm test
