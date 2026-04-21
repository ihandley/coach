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

- Outputs should be consistent and predictable
- Avoid stylistic variation unless requested
- Prefer explicit structure over prose

---

### 4. Small, controlled changes

- Do not refactor broadly unless asked
- Do not reorganize files without instruction
- Do not introduce new abstractions casually

---

### 5. No hidden assumptions

- If something is missing, say it is missing
- Do not infer critical data silently
- Ask or flag uncertainty when needed

---

## Repository Conventions

### File Roles

- `/data/` → canonical job + resume data
- `/skills/` → reusable job-coach operations
- `/instructions/` → system prompts and behavioral rules
- `/scripts/` → automation and utilities
- `/ai/` → AI memory and working context (if present)

Respect these boundaries.

---

### Canonical Sources

When available, these are authoritative:

- resume data file(s)
- job tracker data
- normalized job records
- generated outputs

If there is a conflict between chat context and repo data, trust the repo.

---

## Workflow Model

All tasks fall into one of these categories:

- ingest
- normalize
- evaluate
- prioritize
- tailor
- draft
- export
- track

Always identify the category before acting.

---

## Session Start Rule

At the beginning of each session:

- Follow the `.ai/README.md` Session Start Protocol
- Ensure branch and draft PR exist before implementation
- Do not begin coding until session state is initialized

---

## Implementation Rules

### When writing code

- follow existing patterns in the repo
- prefer consistency over cleverness
- use existing utilities before creating new ones
- keep changes minimal and scoped
- ensure outputs match existing formats

---

### When modifying data

- preserve existing records
- avoid overwriting fields without intent
- maintain schema compatibility
- validate assumptions before writing changes

---

### When adding features

- align with existing workflow model
- do not bypass structured steps
- ensure new functionality composes with existing flows

---

## AI Behavior Expectations

### Do

- read relevant files before making changes
- explain what you are doing and why
- work step-by-step for multi-step tasks
- produce outputs that can be reused later
- keep responses actionable

---

### Do Not

- invent user experience, history, or qualifications
- fabricate job details
- generate generic filler content
- bypass defined workflows
- make destructive changes silently

---

## Output Guidelines

- be concise and direct
- prefer structured output where applicable
- use clear sections and labels
- avoid unnecessary verbosity
- do not use em dashes
- use plain ASCII punctuation

---

## Step-by-Step Execution Mode

For implementation work:

1. Identify the task
2. Identify affected files
3. Explain the approach
4. Provide exact changes
5. Keep steps small and testable
6. Confirm expected outcome
7. State the next step

---

## Error Handling

If something is unclear or missing:

- explicitly state what is missing
- suggest the smallest next step
- do not guess critical information

---

## Change Safety

Before making changes, consider:

- will this break existing workflows?
- will this corrupt data?
- is this reversible?
- is this consistent with the system?

If not, stop and clarify.

---

## Session Awareness

At the start of work:

- identify the current task
- identify relevant files
- identify workflow category

At the end of work:

- summarize changes
- note any open questions
- suggest the next step

---

## Final Rule

This system is designed to be **repeatable and reliable**.

When in doubt, choose:

- clarity over cleverness
- structure over improvisation
- safety over speed

---

## Canonical Sources

- Primary repository: https://github.com/ihandley/coach
- resume data file(s)
- job tracker data
- normalized job records
- generated outputs