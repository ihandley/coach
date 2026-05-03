# Codex Regression Fix Prompt

CODING MODE

Fix the regression without broad rewrites.

Use origin/main as the source of truth for existing behavior.

Hard constraints:
- Do NOT modify unrelated files.
- Do NOT revert entire files unless explicitly required.
- Do NOT reintroduce removed UI or workflows.
- Do NOT change API contracts unless necessary to fix the bug.
- Preserve current behavior and apply only the minimal fix.

Process:
1. Compare affected files against origin/main.
2. Identify the exact regression.
3. Restore only the missing behavior.
4. Keep the diff small.
5. Add a focused regression test.

Validation:
- pnpm lint
- pnpm format
- pnpm typecheck
- pnpm test
