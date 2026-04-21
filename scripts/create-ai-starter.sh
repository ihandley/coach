#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-.}"
AI_DIR="$TARGET_DIR/.ai"
SCRIPTS_DIR="$TARGET_DIR/scripts"

mkdir -p \
  "$AI_DIR/stages" \
  "$AI_DIR/issues" \
  "$AI_DIR/templates" \
  "$SCRIPTS_DIR"

cat > "$AI_DIR/README.md" <<'MD'
# AI Project Context

This folder stores durable, AI-readable project context so new ChatGPT sessions can pick up work faster and with less drift.

## Recommended workflow

1. Keep `project.md` accurate.
2. Update `current.md` at the end of each session.
3. Create one stage file per phase in `stages/`.
4. Create one issue file per task in `issues/`.
5. Use `scripts/ai-context.sh` to compose a prompt bundle for a new session.

## Core files

- `project.md` - stable project summary and goals
- `current.md` - current working state and next step
- `architecture.md` - codebase structure and system design
- `roadmap.md` - planned, active, completed work
- `decisions.md` - important technical decisions and rationale

## Naming suggestions

- Stages: `01-repo-setup.md`, `08-phone-verification.md`
- Issues: `issue-008-phone-verification.md`
MD

cat > "$AI_DIR/project.md" <<'MD'
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
MD

cat > "$AI_DIR/current.md" <<'MD'
# Current Working State

## Branch
current-branch-name

## Current Task
Describe the task currently in progress.

## Recently Completed
- Item one
- Item two

## Current Blocker
Describe the blocker, or write `None`.

## Next Step
Describe the next immediate action.

## Notes
Any short-lived but useful context for the next session.
MD

cat > "$AI_DIR/architecture.md" <<'MD'
# Architecture

## Repo Layout
- `apps/` - app entry points
- `packages/` - shared packages
- `scripts/` - local automation
- `supabase/` - database and backend config

## Key Domains
- Authentication
- User profile
- Billing or credits
- Marketplace or core domain flows

## Data Flow
Describe how data moves through the system.

## External Services
- Service name and purpose

## Testing Strategy
- Unit tests
- Integration tests
- End-to-end tests
MD

cat > "$AI_DIR/roadmap.md" <<'MD'
# Roadmap

## In Progress
- Current stage or issue

## Planned
- Upcoming work item one
- Upcoming work item two

## Completed
- Finished work item one
- Finished work item two

## Deferred
- Anything intentionally postponed
MD

cat > "$AI_DIR/decisions.md" <<'MD'
# Decisions

## YYYY-MM-DD
Decision: Describe the decision.
Reason: Why this decision was made.
Consequence: What this changes or constrains.
MD

cat > "$AI_DIR/stages/00-example-stage.md" <<'MD'
# Stage 00 - Example Stage

## Objective
Describe the outcome of this stage.

## Why
Explain why this stage matters.

## Scope
- In-scope item one
- In-scope item two

## Out of Scope
- Out-of-scope item one
- Out-of-scope item two

## Dependencies
- Dependency one
- Dependency two

## Tasks
- [ ] Task one
- [ ] Task two
- [ ] Task three

## Acceptance Criteria
- Criterion one
- Criterion two
- Criterion three

## Notes
Any implementation guidance or constraints.
MD

cat > "$AI_DIR/issues/issue-000-example.md" <<'MD'
# Issue 000 - Example Issue

## Context
Describe the current state relevant to this task.

## Goal
Describe exactly what needs to be done.

## Requirements
- Requirement one
- Requirement two
- Requirement three

## Suggested Implementation
- Suggested step one
- Suggested step two
- Suggested step three

## Files Likely Affected
- `path/to/file`
- `path/to/another-file`

## Tests
- Test case one
- Test case two
- Test case three

## Definition of Done
- Code implemented
- Tests passing
- Documentation updated if needed
MD

cat > "$AI_DIR/templates/stage-template.md" <<'MD'
# Stage NN - Stage Name

## Objective

## Why

## Scope
- [ ]

## Out of Scope
- [ ]

## Dependencies
- [ ]

## Tasks
- [ ]
- [ ]
- [ ]

## Acceptance Criteria
- [ ]
- [ ]
- [ ]

## Notes
MD

cat > "$AI_DIR/templates/issue-template.md" <<'MD'
# Issue NNN - Issue Name

## Context

## Goal

## Requirements
- [ ]
- [ ]
- [ ]

## Suggested Implementation
- [ ]
- [ ]
- [ ]

## Files Likely Affected
- `...`

## Tests
- [ ]
- [ ]
- [ ]

## Definition of Done
- [ ]
- [ ]
- [ ]
MD

cat > "$AI_DIR/templates/session-template.md" <<'MD'
Use these files as source of truth for this session:
- .ai/project.md
- .ai/current.md
- .ai/architecture.md
- .ai/stages/<current-stage>.md
- .ai/issues/<current-issue>.md

Working agreements:
- Use step-by-step execution
- Prefer TDD when appropriate
- Do not assume work is complete unless stated
- Call out uncertainty explicitly

Task for this session:
<describe the exact task>
MD

cat > "$SCRIPTS_DIR/ai-context.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"
STAGE_FILE="${2:-}"
ISSUE_FILE="${3:-}"

AI_DIR="$ROOT_DIR/.ai"

if [[ ! -f "$AI_DIR/project.md" ]]; then
  echo "Missing $AI_DIR/project.md" >&2
  exit 1
fi

if [[ ! -f "$AI_DIR/current.md" ]]; then
  echo "Missing $AI_DIR/current.md" >&2
  exit 1
fi

print_section() {
  local title="$1"
  local file="$2"

  if [[ -f "$file" ]]; then
    echo "=================================================="
    echo "$title"
    echo "=================================================="
    cat "$file"
    echo
  fi
}

echo "Use the following files as source of truth for this session."
echo "Work from the project context below."
echo

print_section ".ai/project.md" "$AI_DIR/project.md"
print_section ".ai/current.md" "$AI_DIR/current.md"
print_section ".ai/architecture.md" "$AI_DIR/architecture.md"

if [[ -n "$STAGE_FILE" ]]; then
  print_section ".ai/stages/$STAGE_FILE" "$AI_DIR/stages/$STAGE_FILE"
fi

if [[ -n "$ISSUE_FILE" ]]; then
  print_section ".ai/issues/$ISSUE_FILE" "$AI_DIR/issues/$ISSUE_FILE"
fi

echo "Working agreements:"
echo "- Use step-by-step execution"
echo "- Prefer TDD when appropriate"
echo "- Do not assume missing implementation exists"
echo "- Call out uncertainty explicitly"
SH

cat > "$SCRIPTS_DIR/ai-context.py" <<'PY'
#!/usr/bin/env python3
from pathlib import Path
import sys

root_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
stage_file = sys.argv[2] if len(sys.argv) > 2 else ''
issue_file = sys.argv[3] if len(sys.argv) > 3 else ''
ai_dir = root_dir / '.ai'

required = [ai_dir / 'project.md', ai_dir / 'current.md']
missing = [str(p) for p in required if not p.exists()]
if missing:
    print('Missing required files:', ', '.join(missing), file=sys.stderr)
    sys.exit(1)


def print_section(title: str, path: Path) -> None:
    if path.exists():
        print('=' * 50)
        print(title)
        print('=' * 50)
        print(path.read_text())
        print()


print('Use the following files as source of truth for this session.')
print('Work from the project context below.')
print()

print_section('.ai/project.md', ai_dir / 'project.md')
print_section('.ai/current.md', ai_dir / 'current.md')
print_section('.ai/architecture.md', ai_dir / 'architecture.md')

if stage_file:
    print_section(f'.ai/stages/{stage_file}', ai_dir / 'stages' / stage_file)

if issue_file:
    print_section(f'.ai/issues/{issue_file}', ai_dir / 'issues' / issue_file)

print('Working agreements:')
print('- Use step-by-step execution')
print('- Prefer TDD when appropriate')
print('- Do not assume missing implementation exists')
print('- Call out uncertainty explicitly')
PY

chmod +x "$SCRIPTS_DIR/ai-context.sh" "$SCRIPTS_DIR/ai-context.py"

echo "Created AI starter kit in: $TARGET_DIR"
echo ""
echo "Generated:"
echo "- $AI_DIR/README.md"
echo "- $AI_DIR/project.md"
echo "- $AI_DIR/current.md"
echo "- $AI_DIR/architecture.md"
echo "- $AI_DIR/roadmap.md"
echo "- $AI_DIR/decisions.md"
echo "- $AI_DIR/stages/00-example-stage.md"
echo "- $AI_DIR/issues/issue-000-example.md"
echo "- $AI_DIR/templates/stage-template.md"
echo "- $AI_DIR/templates/issue-template.md"
echo "- $AI_DIR/templates/session-template.md"
echo "- $SCRIPTS_DIR/ai-context.sh"
echo "- $SCRIPTS_DIR/ai-context.py"
