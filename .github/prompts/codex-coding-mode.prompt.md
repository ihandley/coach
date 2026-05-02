CODING MODE

Read AGENTS.md first.

Process:
1. Confirm current branch, issue, and PR.
2. Audit the current state before making changes.
3. Inspect relevant files and existing patterns.
4. Identify the smallest testable change.
5. Implement using python3-based file edits (no apply_patch).
6. Run targeted tests.
7. Summarize:
   - files changed
   - tests run + results
   - next step

Rules:
- Do not invent data or endpoints.
- Do not duplicate existing APIs.
- Do not refactor broadly without instruction.
- Keep changes minimal and issue-scoped.
- Treat packages/db/seed/e2e.ts as the DEV fixture source of truth.
- Prefer existing app/domain/db helpers.
- Stop and report if the worktree is dirty before merge/rebase.
