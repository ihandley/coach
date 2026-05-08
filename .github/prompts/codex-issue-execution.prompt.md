# Codex Issue Execution

CODING MODE

Work on Issue #{ISSUE_NUMBER}.

Use the GitHub issue as source of truth.

## Goal

Make the smallest viable change that satisfies the acceptance criteria.

## Rules

- Inspect only relevant files
- Keep the diff narrow
- Reuse existing patterns
- Preserve existing behavior unless the issue requires changing it
- Avoid unrelated refactors, reformatting, and rewrites
- Do not infer extra features
- Stop and explain if scope grows beyond the issue

## Token Discipline

- Do not restate the issue
- Do not summarize unrelated files
- Avoid broad scans
- Avoid large outputs
- Keep updates short

## Validation

- Do not run the full test suite by default
- Run only targeted checks directly related to the change
- Use Playwright only for UI flow changes or when explicitly requested
- Avoid rerunning the same failing command without code changes
- After two failed attempts, stop and report the likely cause
- If validation is skipped, say what was skipped and why

## Stop

Stop after implementation, targeted validation or stated skip rationale, and remaining risks/manual checks.
