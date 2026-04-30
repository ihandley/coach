# Agent Workflow Rules (Job Coach)

## Core Principle
All changes must be deterministic and idempotent.


## Idempotent Patch Rule (CRITICAL)

All assistant-applied code changes MUST be idempotent.

### Rules
- No duplicate imports
- No duplicate function definitions
- No duplicate seed entries
- No repeated injections into files
- Patches must detect existing state before applying changes
- Re-running the same patch must result in no further changes

### Implementation requirements
- Always check before inserting
- Prefer replace-over-insert instead of append
- Never blindly modify lists, imports, or arrays
