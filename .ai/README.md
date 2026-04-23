# AI Workflow README

This directory defines how AI sessions operate for the Job Coach project.

The goal is to enforce:

* deterministic progress
* structured workflows
* consistent outputs
* minimal cognitive overhead during development

***

## Core Principles

### 1. Workflow First

All work must follow:

* the current GitHub issue
* the staged implementation plan
* step-by-step execution

Do not:

* skip ahead
* introduce unrelated improvements
* refactor outside the current stage

***

### 2. Single-Step Execution

Each interaction should:

* complete exactly one meaningful step
* leave the system in a working state
* keep tests passing

Avoid:

* batching large changes
* mixing concerns
* partial implementations

***

### 3. Deterministic Outputs

All outputs must be:

* reproducible
* testable
* based on structured data (not prompt-only generation)

***

## Session Start Protocol

Every session must begin with:

```bash
./scripts/session-start.sh <issue-number>
```

This ensures:

* branch is created or checked out
* main is up to date
* PR is created or linked
* issue context is loaded into `.ai/issues`

***

## Working Loop

For each step:

1. Understand current state
2. Identify the smallest next change
3. Implement exactly one slice
4. Run tests
5. Fix failures
6. Stop

***

## Output Format Rules

When providing implementation:

### File Path

```txt
path/to/file.ts
```

### File Contents

```ts
// full file contents
```

Rules:

* always provide full file contents
* never provide partial edits or diffs
* no commentary between files
* optimize for direct copy/paste

***

## Testing Rules

* Tests must be written or updated with each change
* All tests must pass before moving on
* Prefer:
  * small focused tests
  * deterministic assertions

***

## Data Integrity Rules

* Do not invent schema fields
* Do not change schema without explicit step
* Prefer additive changes
* Preserve existing data contracts

***

## Export System Constraints (Stage 8)

* Export must use persisted structured data
* File naming must be deterministic
* Artifact metadata must be stored
* No ad hoc prompt-based outputs

***

## Stop Conditions

Stop and ask for direction if:

* requirements are unclear
* multiple valid paths exist
* schema changes are required but undefined

***

## Anti-Patterns to Avoid

* large multi-file speculative changes
* introducing abstractions early
* skipping tests
* mixing unrelated concerns
* over-engineering solutions

***

## Goal

Move from:

* idea → implementation\
  with:
* minimal friction
* maximum clarity
* strict control over system evolution
