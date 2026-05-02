ISSUE PLANNING MODE

Read AGENTS.md first.

Goal:
Create a clear, step-by-step implementation plan for the current issue.

***

Process:

1. Restate the goal in concrete terms.
2. Identify affected areas:
   * UI
   * API routes
   * domain/core logic
   * DB/repositories
   * tests
3. Inspect existing code paths and reuse points.
4. Break work into small, testable steps.
5. Identify risks and edge cases.
6. Define acceptance criteria.

***

Output format:

# Issue <number> – <title>

## Goal

...

## Current State

...

## Gaps

...

## Plan

1. ...
2. ...

## Test Plan

...

## Definition of Done

...

***

Plan file requirements:

* Save the plan to:
  .ai/plans/issue-<number>-<slug>.md

* Use lowercase kebab-case for the slug.

* Plans are temporary execution documents:
  * NOT source of truth
  * NOT product requirements
  * MUST align with the GitHub issue

* The GitHub issue remains the canonical definition of requirements.

* After implementation is complete:
  * the plan should be deleted or ignored
  * do not accumulate stale plans

***

Rules:

* Do not propose new architecture unless required.
* Prefer extending existing flows.
* Keep plan grounded in actual repo structure.
* Avoid vague steps like “refactor” or “clean up”.
