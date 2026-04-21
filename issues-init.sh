#!/usr/bin/env bash
set -euo pipefail

# ==========================================
# Config
# ==========================================
OWNER="ihandley"
REPO="opencode-config"
REPO_SLUG="$OWNER/$REPO"

# Optional
LABELS="job-coach"
MILESTONE=""   # Example: "Job Coach Rebuild"
PROJECT=""     # Example: "Job Coach"

OUT_DIR="./github-issues/job-coach-rebuild"
mkdir -p "$OUT_DIR"

# ==========================================
# Helpers
# ==========================================
create_issue() {
  local title="$1"
  local file="$2"

  local args=(
    issue create
    --repo "$REPO_SLUG"
    --title "$title"
    --body-file "$file"
  )

  if [[ -n "$LABELS" ]]; then
    IFS=',' read -ra label_array <<< "$LABELS"
    for label in "${label_array[@]}"; do
      args+=(--label "$label")
    done
  fi

  if [[ -n "$MILESTONE" ]]; then
    args+=(--milestone "$MILESTONE")
  fi

  if [[ -n "$PROJECT" ]]; then
    args+=(--project "$PROJECT")
  fi

  gh "${args[@]}"
}

write_file() {
  local path="$1"
  cat > "$path"
}

# ==========================================
# Preconditions
# ==========================================
command -v gh >/dev/null 2>&1 || {
  echo "Error: GitHub CLI (gh) is not installed."
  exit 1
}

gh auth status >/dev/null 2>&1 || {
  echo "Error: gh is not authenticated. Run: gh auth login"
  exit 1
}

# ==========================================
# Issue 01
# ==========================================
write_file "$OUT_DIR/01-architecture-and-scope.md" <<'EOF'
# Summary

Rebuild the OpenCode job coach as a normal application architecture instead of an OpenCode-first agent runtime.

# Goal

Define the target architecture, boundaries, responsibilities, and phased implementation plan for the new job coach system.

This issue is complete when there is a clear, written technical plan for:
- application structure
- canonical data model
- AI integration boundaries
- service boundaries
- workflow boundaries
- phased implementation order

# Why

The current OpenCode job coach is too dependent on prompt routing, file-based state, and skill discovery behavior. We need a deterministic, testable architecture where:
- state is explicit
- workflows are predictable
- AI is bounded
- failures are recoverable
- outputs are versioned

# In Scope

- Define the target architecture
- Define services and modules
- Define runtime boundaries
- Define where AI is allowed and not allowed
- Define initial folder structure
- Define implementation phases

# Out of Scope

- Full implementation of database schema
- Full implementation of UI
- Final export pipeline
- Workflow engine integration such as LangGraph or Temporal

# Requirements

## Product Direction
The new system should be treated as a standard app with AI-enhanced steps, not as a free-form agent shell.

## Required Architectural Principles
- Database is the source of truth
- Application services own workflow orchestration
- AI calls only happen inside bounded functions
- Schema-validated outputs are required for AI extraction/scoring steps
- Files are artifacts, not canonical state
- Human review is supported at major checkpoints
- Every important write should be traceable and versioned

## Required Modules
Create a documented plan for these modules:
- JobImportService
- JobTrackerService
- FitScoringService
- ResumeProfileService
- ResumeTailoringService
- CoverLetterService
- ApplicationPacketService
- ExportService

## Required Entity Plan
Document the intended purpose of:
- jobs
- job_sources
- resume_profiles
- resume_versions
- fit_evaluations
- tailored_resumes
- cover_letters
- application_packets
- application_events
- exported_artifacts

## Required Workflow Plan
Document at least these top-level workflows:
- import job from URL
- score job fit
- tailor resume for job
- draft cover letter
- build application packet
- update application status
- export final artifacts

# Deliverables

- Architecture document in the repo
- Proposed folder structure
- Service boundary definitions
- Entity responsibility definitions
- Initial roadmap with implementation order

# Suggested Repo Additions

Create a document such as:
- docs/job-coach/architecture.md

Potential package/app layout:
- apps/job-coach-web
- packages/core
- packages/db
- packages/ai
- packages/documents

# Acceptance Criteria

- There is a written architecture document in the repo
- The document clearly explains why the new system is app-first instead of OpenCode-first
- Major entities and services are defined
- Workflow boundaries are defined
- AI integration boundaries are explicitly documented
- There is a phased implementation plan that later issues can follow

# Notes for ChatGPT

When working this issue:
- prefer practical architecture over abstract theory
- optimize for reliability, testability, and future maintainability
- avoid overengineering
- keep orchestration simple unless complexity proves otherwise
EOF

# ==========================================
# Issue 02
# ==========================================
write_file "$OUT_DIR/02-db-schema-and-migrations.md" <<'EOF'
# Summary

Replace file-based canonical state with a real database schema and migration strategy for the job coach.

# Goal

Design and implement the initial database schema that will replace the current JSON-file-based state.

# Why

The current job coach depends on mutable files for important state. That makes the system fragile, hard to audit, and easy to corrupt. The database must become the source of truth for all core job coach data.

# In Scope

- Schema design
- Initial migrations
- Typed models or ORM schema
- Constraints and indexes
- Seed strategy if needed
- Local development database setup

# Out of Scope

- Full UI
- Final exports
- Advanced search
- Workflow engine integration

# Required Tables

At minimum, define and implement:

## jobs
Stores the normalized job record.

Suggested fields:
- id
- company_name
- title
- location
- employment_type
- compensation_text
- remote_type
- raw_description
- normalized_description
- status
- source_url
- created_at
- updated_at

## job_sources
Tracks where a job came from and raw source metadata.

Suggested fields:
- id
- job_id
- source_type
- source_url
- source_payload
- fetched_at

## resume_profiles
Stores the baseline resume profile.

Suggested fields:
- id
- name
- headline
- summary
- structured_profile_json
- created_at
- updated_at

## resume_versions
Versioned resume artifacts and structured content.

Suggested fields:
- id
- resume_profile_id
- version_name
- content_json
- source_type
- created_at

## fit_evaluations
Stores fit scoring results.

Suggested fields:
- id
- job_id
- resume_profile_id
- score
- recommendation
- rationale_json
- strengths_json
- gaps_json
- created_at

## tailored_resumes
Stores job-specific tailored resume outputs.

Suggested fields:
- id
- job_id
- resume_profile_id
- base_resume_version_id
- tailoring_plan_json
- content_json
- status
- created_at
- updated_at

## cover_letters
Stores generated cover letters.

Suggested fields:
- id
- job_id
- tailored_resume_id
- content_markdown
- content_text
- status
- created_at
- updated_at

## application_packets
Logical grouping of final materials.

Suggested fields:
- id
- job_id
- tailored_resume_id
- cover_letter_id
- notes_json
- created_at
- updated_at

## application_events
Tracks status changes and important timeline events.

Suggested fields:
- id
- job_id
- event_type
- event_timestamp
- notes
- metadata_json
- created_at

## exported_artifacts
Tracks generated files and source references.

Suggested fields:
- id
- artifact_type
- source_entity_type
- source_entity_id
- file_path
- mime_type
- created_at

# Requirements

## Data Integrity
- foreign keys on all related entities
- reasonable not-null constraints
- status fields constrained to known values where appropriate
- indexes on commonly queried fields such as job status, company_name, created_at

## Auditability
- preserve history where versioning matters
- never overwrite important derived outputs without retaining prior versions or event history

## Portability
Choose one:
- SQLite for local-first simplicity
- Postgres for more durable multi-environment growth

Whichever is chosen, document why.

## Migration Strategy
- create initial migration(s)
- document how to apply them
- document how local reset works
- document how seed/dev data works if included

# Deliverables

- migration files
- ORM schema or typed DB definitions
- setup documentation
- basic data access layer or repository scaffolding

# Acceptance Criteria

- All required tables exist
- Relationships are enforced
- Migrations can be applied from scratch
- There is documentation for local DB setup
- JSON files are no longer required as the canonical source of truth for these entities

# Notes for ChatGPT

When implementing:
- favor clarity over premature optimization
- choose status enums carefully
- keep the schema normalized enough to be maintainable