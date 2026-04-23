# AGENT.md

## Purpose

This repository contains the Job Coach application.

The purpose of this file is to define how AI assistants should operate when working in this codebase.

This is not a general coding assistant context.\
This is a structured system with defined workflows, data contracts, and constraints.

AI must follow these rules to avoid breaking system integrity.

***

## System Overview

The Job Coach is a workflow-driven application that helps users:

* ingest job postings
* evaluate job fit
* tailor resumes
* generate cover letters
* track applications
* export application materials

This system is built around:

* structured data
* repeatable workflows
* non-destructive updates
* deterministic outputs

***

## Core Principles

### 1. The system is workflow-first, not prompt-first

Do not generate ad hoc outputs if a workflow exists.

Prefer:

* defined steps
* reusable logic
* consistent schemas

***

### 2. Structured data is the source of truth

* Do not invent fields
* Do not change schema without explicit instruction
* Do not discard existing data
* Prefer additive updates over destructive ones

***

### 3. Determinism over creativity

* Outputs should be consistent and predictable
* Avoid stylistic variation unless requested
* Prefer explicit structure over prose

***

### 4. Small, controlled changes

* Do not refactor broadly unless asked
* Do not reorganize files without instruction
* Do not introduce new abstractions casually

***

### 5. No hidden assumptions

* If something is missing, say it is missing
* Do not infer critical data silently
* Ask or flag uncertainty when needed

***

## Session State

Do not rely on `.ai/current.md` or any manual session-state file for active progress tracking.

Active state must be derived from:

* GitHub issue
* active branch
* pushed commit history
* draft PR

If `.ai/current.md` exists, treat it as informational only, not authoritative.

***

## Repository Conventions

### File Roles

* `/data/` → canonical job + resume data
* `/skills/` → reusable job-coach operations
* `/instructions/` → system prompts and behavioral rules
* `/scripts/` → automation and utilities
* `/ai/` → AI memory and working context (if present)

Respect these boundaries.

***

### Canonical Sources

When available, these are authoritative:

* resume data file(s)
* job tracker data
* normalized job records
* generated outputs

If there is a conflict between chat context and repo data, trust the repo.

***

## Workflow Model

The system is organized into stages.

Each stage:

* has a clear objective
* produces structured outputs
* feeds the next stage

AI must:

* understand the current stage
* complete only the current stage’s responsibilities
* not jump ahead or mix stages

***

## Issue-Based Execution Workflow

All implementation work is scoped to a GitHub issue.

### Source of Truth

Use these in order:

1. GitHub issue for requirements and acceptance criteria
2. Active issue branch for implementation context
3. Pushed commit history for progress checkpoints
4. Draft PR for handoff and review context
5. Durable repo docs such as `AGENT.md`, `.ai/project.md`, and architecture docs

Do not rely on manual session-state files for active progress tracking.

***

### Session Start Rule

Before implementing any issue work:

1. Run `./scripts/session-start.sh <issue_number>`
2. Confirm the active branch matches the issue
3. Confirm the draft PR exists or was reused
4. Begin the next small, testable block of work

Do not begin coding until the issue branch and draft PR exist.

***

### Checkpoint Rule

Implementation work must proceed in small, testable blocks.

At the end of each meaningful block:

* stop
* summarize what changed
* provide exact `git add`, `git commit`, and `git push` commands
* treat the pushed commit as the checkpoint

***

### Handoff Rule

When stopping work:

* ensure the latest meaningful checkpoint is committed and pushed
* use the draft PR as the handoff and review surface
* summarize remaining work in the PR if needed

***

### Commit Format

Use commit messages in this format:

`issue-<n>: <checkpoint description>`

Examples:

* `issue-3: add failing URL validation test`
* `issue-3: implement minimal URL validation`
* `issue-3: define import service contract`

***

## Session Awareness

At the start of work:

* identify the GitHub issue
* identify the active branch
* identify the workflow category
* identify the next small, testable block

At the end of each work block:

* summarize what changed
* provide exact commit and push commands
* state the next step

At the end of work:

* confirm the latest checkpoint was committed and pushed
* note any open questions
* suggest the next step

***

## Constraints

* Use step-by-step execution
* Prefer TDD when appropriate
* Do not assume work is complete unless explicitly stated
* Call out uncertainty explicitly
* Do not skip validation or error handling
* Do not introduce breaking schema changes without instruction

***

## Expectations

AI should behave like a disciplined senior engineer:

* precise
* structured
* incremental
* test-driven
* context-aware

Avoid:

* large unstructured outputs
* skipping steps
* implicit assumptions
* mixing unrelated concerns

## Response Formatting Rules

When providing implementation steps, the assistant must follow this exact format:

### 1. File Paths

* Always present file paths in a **copyable code block**
* Do not inline file paths in plain text

  Example:

  ```txt
  packages/db/src/example/file.ts
  ```

### 2. File Contents

* Immediately follow each file path with the full file contents
* Use a code block with the appropriate language (ts, sql, json, etc.)
* Do not truncate content
* Do not summarize

  Example:

  ```txt
  export function example() {
      return "value";
  }
  ```

### 3. Structure

* Each file must be presented in this order:
  1. File path (code block)
  2. File contents (code block)
* No commentary between path and contents

### 4. No Extra Noise

* Do not explain the code unless explicitly asked
* Do not add commentary between files
* Do not restate requirements
* Keep output optimized for direct copy/paste into editor

### 5. Updates vs New Files

* If replacing a file, still provide the full file contents
* Do not provide diffs or partial edits

### 6. Tests and Commands

* Commands may be included at the end
* Commands should also be in code blocks

### 7. Markdown File Handling

* If the requested file is a Markdown file that itself contains fenced code blocks, prefer generating the file as a downloadable artifact instead of pasting the full contents inline in chat.
* This avoids broken or confusing nested code fence formatting in the conversation.
* In those cases:
  1. provide the file as a download
  2. clearly label the file name
  3. avoid also pasting the full Markdown inline unless explicitly requested

### 8. Default Output Mode by File Type

* For normal source files (`.ts`, `.tsx`, `.js`, `.json`, `.sql`, etc.):
  * provide:
    1. file path in a copyable code block
    2. full file contents in a code block
* For Markdown files with fenced code blocks:
  * provide a downloadable file by default
* Only paste Markdown inline when the user explicitly asks for pasted contents
