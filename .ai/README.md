# AI Context

This directory contains durable working context for the Job Coach system.

It is designed to make the repository:

- structured
- repeatable
- inspectable

This is not the primary source of active implementation state.

For active implementation work, use GitHub as the source of truth:

- GitHub issue = scope
- issue branch = active workspace
- pushed commit history = checkpoints
- draft PR = handoff and review surface

---

## How to Start a Session

1. Follow `AGENT.md`.
2. Run:

```bash
./scripts/session-start.sh <issue_number>
```

3. Confirm:
   - the active branch matches the issue
   - the draft PR exists or will be created after the first checkpoint commit
4. Identify:
   - current issue scope
   - workflow category
   - next small, testable block

Do not rely on manual session-state files for active progress tracking.

---

## Session Model

This repo uses an issue-based workflow.

- GitHub issue = requirements and acceptance criteria
- Branch = active implementation context
- Commit history = progress checkpoints
- Draft PR = handoff and review surface

If there is a conflict between repo docs and active GitHub work state, use this order:

1. GitHub issue
2. active branch
3. pushed commit history
4. draft PR
5. durable repo docs

---

## Directory Structure

- `.ai/project.md` → project overview and goals
- `.ai/architecture.md` → architecture notes
- `.ai/decisions.md` → important decisions and consequences
- `.ai/roadmap.md` → planned work
- `.ai/issues/` → optional local mirror of issue definitions
- `.ai/notes/` → optional scratch notes

These files are durable reference material, not the primary execution log.

---

## Workflow Model

All work should map to one of:

- ingest
- normalize
- evaluate
- prioritize
- tailor
- draft
- export
- track

Identify the workflow before acting.

---

## Execution Style

- Step-by-step
- Small changes
- Prefer TDD when appropriate
- Deterministic outputs
- No hidden assumptions

---

## Implementation Rules

- Do not invent schema fields
- Do not overwrite data without intent
- Do not refactor broadly without instruction
- Prefer existing patterns
- Keep changes minimal and scoped

---

## Testing Requirements

- Start with a small, testable slice
- Prefer failing test first when appropriate
- Avoid testing external systems directly
- Mock boundaries such as network, AI, and DB where practical

---

## Checkpoints

At the end of each meaningful work block:

1. Summarize what changed.
2. Commit with:

```text
issue-<n>: <checkpoint description>
```

3. Push the branch.

The pushed commit is the checkpoint.

---

## Handoff

When stopping work:

1. Ensure the latest meaningful checkpoint is committed and pushed.
2. Use the draft PR as the handoff surface.
3. Note the next step in PR context if needed.

---

## Principle

This system is designed to be:

- repeatable
- reliable
- inspectable

When in doubt:

- choose structure over improvisation
- choose safety over speed
- choose clarity over cleverness
