# Agent Workflow Rules (Job Coach)

## Core Principle

All changes must be deterministic and idempotent.

## Idempotent Patch Rule (CRITICAL)

All assistant-applied code changes MUST be idempotent.

### Rules

* No duplicate imports
* No duplicate function definitions
* No duplicate seed entries
* No repeated injections into files
* Patches must detect existing state before applying changes
* Re-running the same patch must result in no further changes

### Implementation requirements

* Always check before inserting
* Prefer replace-over-insert instead of append
* Never blindly modify lists, imports, or arrays

# Agent Instructions

## Planning Behavior

When user says:

* "write a plan for \_\_\_"
* "create a plan for \_\_\_"
* "plan \_\_\_"

You MUST:

1. Create a markdown file in `.ai/plans/`
2. Use clear, structured formatting:
   * Goal
   * Steps
   * Edge cases
   * Testing strategy
   * Definition of Done
3. Do NOT implement anything
4. Only design execution steps

## Execution Behavior

Only when explicitly told:

* "execute the plan"

Then:

* follow steps sequentially
* make minimal diffs
* validate after each change