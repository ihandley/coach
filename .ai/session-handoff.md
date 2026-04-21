========================================
AGENT
========================================
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

- ingest (job intake)
- normalize (structure job data)
- evaluate (fit analysis)
- prioritize (ranking/filtering)
- tailor (resume customization)
- draft (cover letter generation)
- export (document generation)
- track (job lifecycle updates)

Always identify the category before acting.

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

## Canonical Sources

- Primary repository: https://github.com/ihandley/coach
- resume data file(s)
- job tracker data
- normalized job records
- generated outputs

========================================
PROJECT
========================================
# Project

## Summary
Briefly describe the project.

## Goal
State the primary outcome you are trying to achieve.

## Current Status
Describe what is already built.

## Active Stage
Name the current phase of work.

## Next Priorities
1. First priority
2. Second priority
3. Third priority

## Stack
- Primary framework
- Database
- Backend services
- Testing tools

## Constraints
- Solo developer / team constraints
- Delivery constraints
- Product constraints

## Repository
- Primary repo: https://github.com/ihandley/coach

========================================
CURRENT
========================================
# Current Working State

## Active Issue
.ai/issues/0003-stage-3-implement-import-job-from-url-and-structured-job-extraction.md

## Branch
feature/issue-3-import-from-job

## Current Task
Select the first task of issue 3

## Next Step
Define the first TDD slice for issue 3

## Constraints
- Step-by-step
- TDD

========================================
STAGE
========================================
(missing .ai/stage.md)

========================================
ISSUE
========================================
# GitHub Issue #3

- Title: Stage 3: Implement import job from URL and structured job extraction
- State: OPEN
- Labels: job-coach-rebuild, stage-3, backend, ai, testing
- URL: https://github.com/ihandley/coach/issues/3
- Created: 2026-04-21T16:40:53Z
- Updated: 2026-04-21T16:40:53Z

## Body

## Summary

Implement the replacement for the old "prepare from link" behavior.

Given a job posting URL, the system should fetch the page, extract useful content, normalize it into structured job data, and save it as a job record plus source metadata.

## Goal

Create a deterministic pipeline for:
1. ingesting a job URL
2. fetching page content
3. extracting structured job data
4. saving the job and source record
5. returning a saved job that later stages can use

## Background

This replaces the previous OpenCode skill-driven behavior around job link preparation and description extraction.

The new version must be:
- typed
- testable
- retryable
- bounded

## Scope

Build:
- importJobFromUrl(url)
- fetch + parse pipeline
- source persistence
- extraction prompt or parser
- structured output validation
- save-to-db flow

## Structured extraction requirements

The extraction result should aim to produce fields like:
- company
- title
- location
- remote/hybrid/on-site
- employment type
- seniority level
- compensation text if present
- responsibilities
- required qualifications
- preferred qualifications
- technologies/skills
- visa/sponsorship hints if present
- raw description
- normalized description

## Implementation requirements

1. Create a job import service
2. Persist source_url and raw source content or source metadata
3. Use schema validation for extracted AI output
4. Handle malformed pages gracefully
5. Prevent duplicate imports where reasonable
6. Add retry/error handling around fetch/extraction
7. Log or persist extraction failures in a useful way

## Testing requirements

Add tests for:
- successful import
- invalid URL
- duplicate URL behavior
- extraction validation failure
- partial data extraction
- saving normalized job data

## Acceptance criteria

- A URL can be imported without manual copy/paste
- The output becomes a persisted job record
- Extracted data is schema-validated
- Source metadata is retained
- Failure modes are explicit and debuggable

## Out of scope

Do not score fit in this issue.
Do not generate tailored resumes in this issue.
Do not build browser automation unless absolutely necessary.

## Deliverables

- import service
- source persistence
- extraction pipeline
- tests
- light documentation for supported import behavior

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.
Inspect the current repo first.
Prefer robust parsing and schema validation over prompt-only magic.

========================================
END CONTEXT
========================================
