# AGENT.md

## Purpose

This repository contains the Job Coach application.

The purpose of this file is to define how AI assistants should operate when working in this codebase.

This is not a general coding assistant context.  
This is a structured system with defined workflows, data contracts, and constraints.

AI must follow these rules to avoid breaking system integrity.

---

## System Overview

The Job Coach is a workflow-driven application that helps users:

- ingest job postings
- evaluate job fit
- tailor resumes
- generate cover letters
- track applications
- export application materials

This system is built around:

- structured data
- repeatable workflows
- non-destructive updates
- deterministic outputs

---

## Core Principles

### 1. The system is workflow-first, not prompt-first

Do not generate ad hoc outputs if a workflow exists.

Prefer:
- defined steps
- reusable logic
- consistent schemas

---

### 2. Structured data is the source of truth

- Do not invent fields
- Do not change schema without explicit instruction
- Do not discard existing data
- Prefer additive updates over destructive ones

---

### 3. Determinism over creativity

- Prefer predictable outputs over clever outputs
- Avoid variability unless explicitly required
- Ensure outputs are testable and reproducible

---

## Workflow Model

The system is organized into stages.

Each stage:
- has a clear objective
- produces structured outputs
- feeds the next stage

AI must:
- understand the current stage
- complete only the current stage’s responsibilities
- not jump ahead or mix stages

---

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

---

### Session Start Rule

Before implementing any issue work:

1. Run `./scripts/session-start.sh <issue_number>`
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