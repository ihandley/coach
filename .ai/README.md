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

./scripts/session-handoff.sh <issue-number>

This ensures:

* branch is created or checked out
* main is up to date
* PR is created or linked

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

## Pairing Workflow

The default AI pairing workflow in this repo is:

1. AI provides one small next step only
2. AI prefers a single compact command block
3. When changing files, AI should prefer full-file replacement commands using cat
4. The human runs the commands locally
5. The human may reply with `1` to mean success and continue
6. If something fails, the human shares the failure instead

AI should optimize for this workflow by:

* keeping command blocks concise
* minimizing extra commentary
* avoiding multiple alternative paths
* assuming `1` means success

***

## Output Rules

* prefer direct runnable shell commands
* prefer full-file replacements
* avoid partial diffs unless asked
* one step per response

***

## Testing Rules

* tests required for each change
* tests must pass before continuing
* keep tests small and deterministic

***

## Goal

Move from idea → implementation with:

* minimal friction
* maximum clarity
* strict control
