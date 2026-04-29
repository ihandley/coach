## Scope Enforcement Rules

- Each GitHub issue defines a strict scope boundary.
- The agent MUST NOT implement changes outside the active issue.

## When User Requests Out-of-Scope Work

If a request does not belong to the current issue:
1. Explicitly say: "This is out of scope for the current issue."
2. Propose creating a new issue.
3. Do NOT implement it in the current branch.

## Architecture Rules

- Never mix Supabase client (`.from`) and Kysely (`selectFrom`) in the same route.
- Data-layer changes must be isolated to their own issue.

## Recovery Rules

- Never restore individual files from old commits unless:
  - the entire feature is verified in that commit
- Prefer rebuilding on top of a known-good baseline

## Checkpoint Rules

- After reaching a working state:
  - Commit immediately
  - Tag checkpoint if significant

## PR Rules

Each PR must:
- Correspond to exactly one issue
- Include a manual verification checklist
- Not include partial migrations

## Regression Prevention Rules

### Active Issue Discipline
- Start every session by stating the active issue number and scope.
- If work is outside that scope, create/reference a separate issue and do not implement it.
- Do not combine UI, API, DB, import scripts, and test rewrites in one PR unless the issue explicitly requires it.

### Data Access Boundary
- Supabase routes may use `.from(...)`.
- Kysely repositories may use `selectFrom(...)`.
- Never pass a Supabase client into a Kysely-style repository.
- Never pass a Kysely db into Supabase-style code.
- If a route needs both, create an adapter or split the work into a data-layer issue.

### No File Time Travel
- Do not run `git checkout <old-sha> -- <file>` unless:
  - the target commit is verified working
  - all dependent files are restored together
  - a diff is reviewed first
- Prefer rebuilding from `origin/main` or a named checkpoint tag.

### Checkpoint Workflow
Before changing code:
- `git status`
- `git branch --show-current`
- confirm active issue

After any verified working state:
- run tests
- commit immediately
- optionally tag major recovery points

### Required Verification
Every PR must include:
- tests run
- manual UI checklist
- API routes touched
- known out-of-scope follow-ups

### Stop Conditions
Stop and reassess if:
- the same error appears twice
- a fix requires touching unrelated files
- runtime behavior regresses
- tests pass but the browser fails

## Regression Prevention Rules

### Active Issue Discipline
- Start every session by stating the active issue number and scope.
- If work is outside that scope, create/reference a separate issue and do not implement it.

### Data Access Boundary
- Supabase routes use `.from(...)`
- Kysely repos use `selectFrom(...)`
- NEVER mix them in the same route

### No File Time Travel
- Never restore individual files from old commits unless the entire feature is verified

### Checkpoint Workflow
- Commit immediately after a working state
- Tag important checkpoints

### Stop Conditions
- Same error twice → stop
- Tests pass but UI broken → stop
- Fix requires touching unrelated files → stop

## Non-Guessing Rule (Critical)

- Do NOT assume file contents, variable names, or structure.
- Do NOT write patch scripts based on patterns unless the exact code is confirmed.
- ALWAYS inspect the current file with grep/sed before modifying it.
- Prefer explicit, surgical edits over regex or bulk replacement.
- If the exact target is unclear, STOP and ask for the relevant snippet.

If this rule is violated, revert and re-approach using direct inspection.

## CODING MODE

When the user says "CODING MODE":

- Only return shell commands (no explanations)
- Group commands into as few steps as possible
- Prefer idempotent commands where possible
- Do not include commentary unless absolutely required
- Assume commands are run from repo root
- Include file creation, edits, and patches inline (use heredocs when needed)


- If terminal visibility is lost or uncertain, explicitly notify the user so they can restore the connection before proceeding

