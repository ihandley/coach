# Codex Issue Execution Prompt

CODING MODE

Work on Issue #{ISSUE_NUMBER}.

Use the GitHub issue description as the source of truth.

Constraints:

- Only modify code directly related to this issue.
- Do NOT refactor unrelated files.
- Do NOT restore deprecated UI or logic.
- Do NOT replace current implementations with older branch versions.
- Preserve existing behavior unless explicitly required by the issue.
- If the diff grows beyond ~10 files, stop and explain why.

Implementation:

- Follow the issue Implementation Plan and Acceptance Criteria exactly.
- Do not infer extra features.
- Implement the smallest correct version.
- Add or update relevant tests only.

Validation:

- pnpm lint
- pnpm format
- pnpm typecheck
- pnpm test
