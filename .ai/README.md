# AI Context

This directory contains the working context for the Job Coach system.

It is designed to make each session:
- deterministic
- resumable
- workflow-driven

This is not memory for conversation.  
This is **state for execution**.

---

## How to Start a Session

1. Follow `AGENT.md`.
2. Read:
   - `.ai/project.md`
   - `.ai/current.md`
   - `.ai/stage.md` (if present)
   - the active issue file in `.ai/issues/`
3. Identify:
   - current task
   - workflow category
   - affected files
4. Do not assume missing context.  
   If something is unclear, state it explicitly.

---

## Session Start Protocol

Before writing any code:

1. Define session name:
   - format: `issue-<n>-<short-task>`
2. Create or verify branch:
   - format: `feature/issue-<n>-<slug>`
3. Create a draft PR immediately.
4. Update `.ai/current.md`:
   - session name
   - branch
   - PR link
   - current task
   - next step
5. Confirm constraints:
   - step-by-step
   - TDD
6. Do not begin implementation until branch and PR exist.

---

## Directory Structure

- `.ai/project.md` → project overview and goals
- `.ai/current.md` → current working state
- `.ai/stage.md` → current stage definition (optional)
- `.ai/issues/` → normalized issue files
- `.ai/notes/` → optional scratch notes

---

## Source of Truth

Always prefer:
1. Repository data files
2. Structured issue files
3. Existing code
4. Chat context (last)

If there is a conflict, trust the repository.

---

## Workflow Model

All work must map to one of:

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
- Test first (TDD)
- Deterministic outputs
- No hidden assumptions

---

## Implementation Rules

- Do not invent schema fields
- Do not overwrite data without intent
- Do not refactor broadly
- Prefer existing patterns
- Keep changes minimal and scoped

---

## Testing Requirements

- Write failing test first
- Implement minimal code to pass
- Avoid testing external systems directly
- Mock boundaries (network, AI, DB)

---

## Error Handling

If something is missing:

- state what is missing
- propose the smallest next step
- do not guess

---

## End of Session

At the end of work:

1. Summarize what changed
2. Confirm tests passing
3. Update `.ai/current.md`:
   - current task
   - next step
4. Identify next TDD slice
5. Ensure PR reflects current state

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