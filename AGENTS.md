# AGENT.md

## Purpose

This repository contains the rebuilt Job Coach application.

The purpose of this file is to define how AI assistants should operate when working in this codebase.

This is not a general coding assistant context.  
This is a structured system with defined workflows, data contracts, constraints, and application layers.

AI must follow these rules to avoid breaking system integrity.

---

## System Overview

The Job Coach is a workflow-driven application that helps users:

- ingest job postings
- evaluate job fit
- tailor resumes
- generate cover letters
- track application workflows
- export application materials

This system is built around:

- structured data
- repeatable workflows
- non-destructive updates
- deterministic outputs
- explicit persistence
- bounded AI-assisted steps

---

## Runtime Model

The canonical product runtime is this application repository.

The Job Coach no longer runs as an OpenCode-centric agent/skills runtime.

OpenCode may still be referenced for:

- migration inventory
- historical comparison
- developer tooling outside the product runtime

But OpenCode is not the source of truth for current application behavior.

Canonical product behavior lives in:

- application code
- database-backed repositories
- workflow orchestration
- API routes
- architecture and migration docs in this repository

---

## Core Principles

### 1. The system is workflow-first, not prompt-first

Do not generate ad hoc outputs if a workflow exists.

Prefer:

- defined steps
- reusable logic
- consistent schemas
- explicit orchestration

---

### 2. Structured data is the source of truth

- Do not invent fields
- Do not change schema without explicit instruction
- Do not discard existing data
- Prefer additive updates over destructive ones
- Persist canonical state in the application data model, not mutable ad hoc files

---

### 3. Determinism over creativity

- Outputs should be consistent and predictable
- Avoid stylistic variation unless requested
- Prefer explicit structure over prose
- Keep AI-backed operations bounded and validated

---

### 4. Small, controlled changes

- Do not refactor broadly unless asked
- Do not reorganize files without instruction
- Do not introduce new abstractions casually
- Prefer the smallest meaningful, testable slice

---

### 5. No hidden assumptions

- If something is missing, say it is missing
- Do not infer critical data silently
- Flag uncertainty when needed
- Do not treat legacy OpenCode assumptions as current runtime behavior

---

## Session State

Do not rely on `.ai/current.md` or any manual session-state file for active progress tracking.

Active state must be derived from:

- GitHub issue
- active branch
- pushed commit history
- draft PR

If `.ai/current.md` exists, treat it as informational only, not authoritative.

---

## Repository Conventions

### File Roles

- `apps/job-coach-web/` → application UI, API routes, and app-facing server composition
- `packages/core/` → domain logic, workflow primitives, and reusable core services
- `packages/db/` → repositories, migrations, persistence adapters, and DB-backed services
- `docs/` → architecture, exports, workflows, migration, and contributor docs
- `scripts/` → automation and maintenance utilities
- `.ai/` → AI workflow support docs for repo development

Respect these boundaries.

---

### Canonical Sources

When available, these are authoritative:

- database-backed structured entities
- repository contracts
- normalized job records
- resume profiles and versions
- cover letter drafts
- exported artifacts
- workflow runs and workflow steps
- durable repo docs such as `README.md`, `AGENT.md`, and `docs/*`

If there is a conflict between chat context, legacy OpenCode material, and current repo code, trust the current application repository.

---

## Workflow Model

The system is organized into explicit stages and workflows.

Each stage:

- has a clear objective
- produces structured outputs
- feeds the next stage

Each workflow:

- is explicit
- tracks run status
- tracks step status
- handles retries in bounded ways
- persists visible state

AI must:

- understand the current stage
- complete only the current stage’s responsibilities
- not jump ahead or mix stages
- avoid reintroducing hidden prompt routing

---

## Issue-Based Execution Workflow

All implementation work is scoped to a GitHub issue.

### Source of Truth

Use these in order:

1. GitHub issue for requirements and acceptance criteria
2. Active issue branch for implementation context
3. Pushed commit history for progress checkpoints
4. Draft PR for handoff and review context
5. Durable repo docs such as `README.md`, `AGENT.md`, `.ai/project.md`, and `docs/*`

Do not rely on manual session-state files for active progress tracking.

---

### Session Start Rule

Before implementing any issue work:

1. Run `./scripts/issue-checkpoint.sh <issue_number>`
2. Confirm the active branch matches the issue
3. Confirm the draft PR exists or was reused
4. Begin the next small, testable block of work

Do not begin coding until the issue branch and draft PR exist.

---

### Checkpoint Rule

Implementation work must proceed in small, testable blocks.

At the end of each meaningful block:

- stop
- summarize what changed
- provide exact `git add`, `git commit`, and `git push` commands
- treat the pushed commit as the checkpoint

---

### Handoff Rule

When stopping work:

- ensure the latest meaningful checkpoint is committed and pushed
- use the draft PR as the handoff and review surface
- summarize remaining work in the PR if needed

---

### Commit Format

Use commit messages in this format:

`issue-<n>: <checkpoint description>`

Examples:

- `issue-3: add failing URL validation test`
- `issue-3: implement minimal URL validation`
- `issue-3: define import service contract`

---

## Session Awareness

At the start of work:

- identify the GitHub issue
- identify the active branch
- identify the workflow category
- identify the next small, testable block

At the end of each work block:

- summarize what changed
- provide exact commit and push commands
- state the next step

At the end of work:

- confirm the latest checkpoint was committed and pushed
- note any open questions
- suggest the next step

---

## Constraints

- Use step-by-step execution
- Prefer TDD when appropriate
- Do not assume work is complete unless explicitly stated
- Call out uncertainty explicitly
- Do not skip validation or error handling
- Do not introduce breaking schema changes without instruction
- Do not reintroduce legacy OpenCode runtime assumptions as product architecture

---

## Expectations

AI should behave like a disciplined senior engineer:

- precise
- structured
- incremental
- test-driven
- context-aware

Avoid:

- large unstructured outputs
- skipping steps
- implicit assumptions
- mixing unrelated concerns

## Response Formatting Rules

When providing implementation steps, the assistant must follow this exact format:

### 1. File Paths

- Always present file paths in a **copyable code block**
- Do not inline file paths in plain text

Example:

```txt
packages/db/src/example/file.ts
```

### 2. File Contents

- Immediately follow each file path with the full file contents
- Use a code block with the appropriate language (`ts`, `sql`, `json`, etc.)
- Do not truncate content
- Do not summarize

Example:

```ts
export function example() {
  return "value";
}
```

### 3. Structure

- Each file must be presented in this order:
  1. File path (code block)
  2. File contents (code block)
- No commentary between path and contents

### 4. No Extra Noise

- Do not explain the code unless explicitly asked
- Do not add commentary between files
- Do not restate requirements
- Keep output optimized for direct copy/paste into editor

### 5. Updates vs New Files

- If replacing a file, still provide the full file contents
- Do not provide diffs or partial edits

### 6. Tests and Commands

- Commands may be included at the end
- Commands should also be in code blocks

### 7. Markdown File Handling

- If the requested file is a Markdown file that itself contains fenced code blocks, prefer generating the file as a downloadable artifact instead of pasting the full contents inline in chat.
- This avoids broken or confusing nested code fence formatting in the conversation.
- In those cases:
  1. provide the file as a download
  2. clearly label the file name
  3. avoid also pasting the full Markdown inline unless explicitly requested

### 8. Default Output Mode by File Type

- For normal source files (`.ts`, `.tsx`, `.js`, `.json`, `.sql`, etc.):
  - provide:
    1. file path in a copyable code block
    2. full file contents in a code block
- For Markdown files with fenced code blocks:
  - provide a downloadable file by default
- Only paste Markdown inline when the user explicitly asks for pasted contents
