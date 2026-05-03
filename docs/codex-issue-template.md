# Codex Execution Template

CODING MODE

Work on Issue #{ISSUE_NUMBER}.

Use the GitHub issue description as the source of truth.

## Constraints

- Only modify code directly related to this issue
- Do NOT refactor unrelated files
- Do NOT restore deprecated UI or logic
- Preserve existing behavior unless explicitly required

## Implementation

- Follow the Implementation Plan and Acceptance Criteria exactly
- Do not infer additional features
- If something is unclear, implement the simplest correct version

## Tests

- Add or update tests relevant to the issue
- Do not rewrite unrelated tests

## Validation

Run:
pnpm lint
pnpm format
pnpm typecheck
pnpm test
