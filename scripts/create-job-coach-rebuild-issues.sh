#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/create-job-coach-rebuild-issues.sh ihandley/opencode-config
#
# Requires:
#   - GitHub CLI installed and authenticated
#   - repo write access
#
# Notes:
#   - Uses gh issue create with --body-file
#   - Uses gh label create --force so it is safe to re-run for labels
#   - Creates a full rebuild plan for replacing the OpenCode-centric job coach
#     with a normal app architecture

REPO="${1:-}"
if [[ -z "$REPO" ]]; then
  echo "Usage: $0 OWNER/REPO"
  exit 1
fi

command -v gh >/dev/null 2>&1 || {
  echo "GitHub CLI (gh) is required."
  exit 1
}

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

create_label() {
  local name="$1"
  local color="$2"
  local description="$3"

  gh label create "$name" \
    --repo "$REPO" \
    --color "$color" \
    --description "$description" \
    --force >/dev/null
}

create_issue() {
  local title="$1"
  local labels="$2"
  local slug="$3"
  local body_file="$TMP_DIR/$slug.md"

  cat > "$body_file"

  IFS=',' read -r -a label_args <<< "$labels"

  cmd=(
    gh issue create
    --repo "$REPO"
    --title "$title"
    --body-file "$body_file"
  )

  for label in "${label_args[@]}"; do
    cmd+=(--label "$label")
  done

  "${cmd[@]}"
}

echo "Creating labels..."

create_label "job-coach-rebuild" "1D76DB" "Parent label for rebuilding the job coach as a real application"
create_label "stage-1" "5319E7" "Stage 1 of the rebuild"
create_label "stage-2" "5319E7" "Stage 2 of the rebuild"
create_label "stage-3" "5319E7" "Stage 3 of the rebuild"
create_label "stage-4" "5319E7" "Stage 4 of the rebuild"
create_label "stage-5" "5319E7" "Stage 5 of the rebuild"
create_label "stage-6" "5319E7" "Stage 6 of the rebuild"
create_label "stage-7" "5319E7" "Stage 7 of the rebuild"
create_label "stage-8" "5319E7" "Stage 8 of the rebuild"
create_label "stage-9" "5319E7" "Stage 9 of the rebuild"
create_label "stage-10" "5319E7" "Stage 10 of the rebuild"
create_label "backend" "0E8A16" "Backend and data model work"
create_label "frontend" "FBCA04" "Frontend and UX work"
create_label "ai" "B60205" "AI prompt and model integration work"
create_label "infra" "0052CC" "Infrastructure, queue, and deployment work"
create_label "docs" "006B75" "Documentation work"
create_label "export" "C2E0C6" "Document export work"
create_label "migration" "D4C5F9" "Migration away from OpenCode runtime behavior"
create_label "testing" "E99695" "Testing and CI work"

echo "Creating issues..."

create_issue "Stage 1: Create the job coach application foundation and database schema" \
"job-coach-rebuild,stage-1,backend,infra,testing" \
"stage-1-foundation-and-schema" <<'EOF'
## Summary

Create the application foundation for the new job coach and replace file-based state with a real database-backed domain model.

This is the first stage of the rebuild away from the OpenCode agent/skills runtime. The goal is to establish the baseline project structure, persistence layer, and typed core models that every later stage will use.

## Background

The current OpenCode-based job coach is fragile because it depends on:
- prompt routing
- skill discovery
- mutable JSON files as canonical data
- non-deterministic agent execution

This stage must create a conventional application foundation so future stages can become deterministic and testable.

## Goal

Build the base app architecture and persistence layer.

By the end of this issue, the repo should have:
- a clear app/package structure
- a real database
- migrations
- typed domain models
- repositories/services stubs
- tests proving the schema and basic CRUD paths work

## Recommended architecture

Use a standard application architecture, not an agent shell:
- app layer for UI/API
- service layer for business logic
- database layer for persistence
- bounded AI adapters later
- export modules later

Preferred stack:
- Next.js for the app surface
- Postgres for durable multi-device use
- SQLite acceptable only if explicitly chosen as a temporary stepping stone
- Prisma, Drizzle, or equivalent typed database layer
- TypeScript end-to-end

## Scope

Create the initial structure for something like:
- apps/job-coach-web
- packages/core
- packages/db
- packages/ai
- packages/documents

Exact naming can differ, but the separation of concerns should be preserved.

## Database design requirements

Create initial tables for:
- resume_profiles
- resume_versions
- jobs
- job_sources
- job_evaluations
- tailored_resumes
- cover_letters
- application_packets
- application_events
- follow_up_drafts
- exported_artifacts

Minimum fields should support:
- stable ids
- created_at / updated_at timestamps
- status fields where appropriate
- linkage between generated artifacts and their source entities
- versioning for resume variants
- room for structured AI output storage

Suggested examples:
- jobs: id, source_url, company, title, location, compensation_text, employment_type, raw_description, normalized_description, status, created_at, updated_at
- resume_profiles: id, name, summary, raw_source, created_at, updated_at
- resume_versions: id, resume_profile_id, version_name, content_json, created_at
- job_evaluations: id, job_id, resume_profile_id, score, recommendation, reasoning_json, created_at
- tailored_resumes: id, job_id, resume_profile_id, source_resume_version_id, content_json, status, created_at
- cover_letters: id, job_id, tailored_resume_id, content_markdown, status, created_at
- application_events: id, job_id, event_type, notes, happened_at, created_at
- exported_artifacts: id, artifact_type, source_entity_type, source_entity_id, file_path_or_key, metadata_json, created_at

## Implementation requirements

1. Create the package/app layout
2. Set up database connection and config
3. Add initial migration(s)
4. Add domain types/interfaces
5. Add repository layer or equivalent data access abstraction
6. Add seed/dev bootstrap support if useful
7. Add env handling for db config
8. Add test setup for database-backed tests
9. Add a short architecture doc explaining the layers

## Acceptance criteria

- No job coach canonical state lives in mutable JSON files anymore for newly built functionality
- Database schema exists and can be migrated locally
- Types for major entities exist
- Basic CRUD tests exist for at least jobs, resume_profiles, and application_events
- Local setup instructions exist
- The new structure is clearly ready for later stages

## Out of scope

Do not build AI features in this issue.
Do not build document export in this issue.
Do not build full UI in this issue beyond what is needed to validate wiring.

## Deliverables

- project structure
- migrations
- schema/types
- repository layer
- initial tests
- setup documentation

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.

When working this issue:
1. inspect the current repo structure first
2. propose the exact folders/files to add or change
3. implement the database foundation
4. add tests
5. provide a PR summary in the established markdown format for this project

Do not drift into later AI workflow work.
EOF

create_issue "Stage 2: Build job tracking CRUD, timeline, and dashboard" \
"job-coach-rebuild,stage-2,backend,frontend,testing" \
"stage-2-job-tracking-dashboard" <<'EOF'
## Summary

Build the first user-visible slice of the new job coach: job tracking, job status updates, application timeline/history, and a dashboard summary.

This should replace the old JSON-backed tracker behavior with explicit database-backed application logic.

## Goal

Create a reliable job tracking subsystem with:
- create job
- list jobs
- view a single job
- update job status
- append application events
- compute dashboard summaries

## Background

The current OpenCode setup had capabilities equivalent to:
- add job
- list jobs
- update status
- show dashboard

These should become normal application features, not skill invocations.

## Scope

Build:
- job creation flow
- jobs list view or API
- job detail view or API
- job status transitions
- application event logging
- dashboard summary service
- basic filtering and sorting

## Required statuses

Support a reasonable controlled vocabulary, for example:
- saved
- researching
- applying
- applied
- interviewing
- offer
- rejected
- withdrawn
- archived

If a different set is chosen, document it and keep it explicit.

## Required domain behavior

- creating a job should store stable source data and current status
- updating a job status should optionally create a timeline event
- application_events should power the history/timeline
- dashboard summaries should include at minimum:
  - total tracked jobs
  - counts by status
  - recently updated jobs
  - optionally counts by week or month

## Implementation requirements

1. Add service methods such as:
   - createJob
   - listJobs
   - getJobById
   - updateJobStatus
   - addApplicationEvent
   - getDashboardSummary
2. Add API routes or server actions
3. Add minimal UI surfaces if this app has a web UI
4. Add validation for input payloads
5. Add tests for status transition behavior and dashboard aggregation

## Suggested filters

- by status
- by company
- by updated date
- by created date
- by keyword

## Acceptance criteria

- A user can create and persist jobs
- A user can update status without touching raw files
- A job has a visible event history
- Dashboard summary is computed from the database
- Tests cover happy path and invalid input cases

## Out of scope

Do not import jobs from URLs yet.
Do not score fit yet.
Do not generate resumes or cover letters yet.

## Deliverables

- CRUD/service layer
- timeline/events
- dashboard aggregation
- tests
- minimal UI or API documentation

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.
Prioritize clean domain modeling over flashy UI.
Keep event history explicit and durable.
EOF

create_issue "Stage 3: Implement import job from URL and structured job extraction" \
"job-coach-rebuild,stage-3,backend,ai,testing" \
"stage-3-import-job-from-url" <<'EOF'
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
EOF

create_issue "Stage 4: Build fit scoring and recommendation engine" \
"job-coach-rebuild,stage-4,backend,ai,testing" \
"stage-4-fit-scoring" <<'EOF'
## Summary

Build the fit scoring and recommendation engine that evaluates a saved job against a baseline resume profile.

This replaces the old match score and fit recommendation skills with a typed, persisted workflow.

## Goal

Given:
- a saved job
- a selected resume profile

Generate:
- a fit score
- structured reasoning
- a recommendation
- a durable evaluation record

## Scope

Build:
- scoreJobFit(jobId, resumeProfileId)
- generateFitRecommendation(jobId, evaluationId) or equivalent combined flow
- persistence of evaluation records
- evaluation history per job/profile pair

## Output requirements

The evaluation should include structured fields such as:
- overall score
- strengths
- gaps
- risk factors
- role alignment summary
- recommendation category

Recommendation categories can be something like:
- strong fit
- good fit
- stretch
- low fit
- skip

Store the reasoning in machine-friendly structured form, not only prose.

## Implementation requirements

1. Create a fit scoring service
2. Define the evaluation schema
3. Use schema validation on AI output
4. Persist evaluations in job_evaluations
5. Support re-running evaluations without mutating source jobs
6. Add clear prompt templates or scoring heuristics in code
7. Keep the logic bounded and deterministic where possible

## UX/API requirements

A user should be able to:
- request a fit score for a job
- view the latest evaluation
- optionally view prior evaluations

## Testing requirements

Add tests for:
- evaluation creation
- re-evaluation
- schema validation
- fallback behavior when AI output is malformed
- service behavior when job or resume profile is missing

## Acceptance criteria

- A fit score can be generated for a saved job
- The result is stored in the database
- The reasoning is structured and reusable
- The system can show whether the job is worth pursuing

## Out of scope

Do not generate tailored resumes in this issue.
Do not generate cover letters in this issue.

## Deliverables

- fit scoring service
- prompt/template module
- evaluation storage
- tests
- minimal UI/API surface to trigger and view results

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.
Favor repeatability and structure over literary output.
EOF

create_issue "Stage 5: Add resume profile ingest and baseline resume review" \
"job-coach-rebuild,stage-5,backend,ai,testing" \
"stage-5-resume-profile-and-baseline-review" <<'EOF'
## Summary

Add the ability to ingest a baseline resume into the new system and generate a baseline review independent of any specific job.

This creates the durable source profile that later job-specific tailoring will build from.

## Goal

Build:
- resume profile import/ingest
- versioned resume storage
- baseline review generation
- resume profile retrieval

## Scope

Implement flows for:
- uploading or importing resume source content
- parsing it into normalized profile data
- storing a versioned resume representation
- running a baseline review that identifies strengths, weaknesses, and improvement opportunities

## Data requirements

Support:
- resume_profiles
- resume_versions
- raw source storage or references
- normalized content storage
- review output storage if needed

Store enough structure to later support:
- bullet-level tailoring
- section-level rewrites
- multiple versions over time

## Baseline review requirements

Generate structured output such as:
- core strengths
- missing signals
- formatting/content concerns
- likely target-role alignment
- recommended improvements

## Implementation requirements

1. Add resume ingestion flow
2. Parse and normalize resume data
3. Create versioning for resumes
4. Build baseline review service
5. Validate structured output
6. Add tests for import, normalization, and review generation

## Acceptance criteria

- A resume can be imported into the new system
- The system stores a reusable baseline profile
- Resume versions are explicit
- A baseline review can be generated and persisted or returned predictably

## Out of scope

Do not tailor the resume to a specific job yet.
Do not generate cover letters yet.

## Deliverables

- resume ingest flow
- normalized profile model
- versioning support
- baseline review service
- tests

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.
Keep the normalized resume representation suitable for future tailoring.
EOF

create_issue "Stage 6: Generate tailoring suggestions and versioned tailored resumes" \
"job-coach-rebuild,stage-6,backend,ai,testing" \
"stage-6-tailored-resumes" <<'EOF'
## Summary

Build the job-specific resume tailoring workflow.

This stage should compare a saved job with a selected baseline resume profile and produce:
- actionable tailoring suggestions
- a versioned tailored resume
- stable persistence for later export

## Goal

Create:
- generateTailoringSuggestions(profileId, jobId)
- createTailoredResume(profileId, jobId)

## Scope

Support:
- suggestion generation
- versioned tailored resume creation
- linkage to source resume version and job
- ability to re-run and create a new tailored version without losing history

## Suggestion requirements

Suggestions should be structured enough to support UI rendering and future editing, for example:
- section target
- original content
- suggested content
- rationale
- related job requirement(s)
- confidence or priority

## Tailored resume requirements

A tailored resume should:
- be linked to a baseline profile
- be linked to the job
- preserve lineage to the source resume version
- be stored in a structured form suitable for export

## Implementation requirements

1. Create a tailoring suggestion service
2. Create a tailored resume generation service
3. Store tailored resumes in the database
4. Preserve source-to-derived lineage
5. Add tests for repeated tailoring, versioning, and validation
6. Make sure malformed AI output cannot silently corrupt the stored resume version

## Acceptance criteria

- A user can generate job-specific resume suggestions
- A user can save a tailored resume version
- Resume lineage is visible and durable
- Re-running creates a new version rather than mutating history

## Out of scope

Do not export DOCX/PDF yet.
Do not generate cover letters in this issue.

## Deliverables

- suggestion service
- tailored resume generation service
- persistence/versioning
- tests
- minimal UI/API surface if appropriate

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.
Preserve structured content. Do not reduce everything to a giant markdown string if avoidable.
EOF

create_issue "Stage 7: Build cover letter drafting and application question answering" \
"job-coach-rebuild,stage-7,backend,ai,testing" \
"stage-7-cover-letters-and-application-answers" <<'EOF'
## Summary

Build the materials-generation stage for:
- cover letters
- reusable application answers
- job-specific written responses

This replaces the old cover-letter and application-form related skills with standard application services.

## Goal

Create:
- draftCoverLetter(jobId, tailoredResumeId)
- answerApplicationQuestion(jobId, questionText)
- optionally build a reusable answer history for repeated questions

## Scope

Support:
- generating a cover letter from a job plus tailored resume
- generating answers to application questions
- storing generated outputs durably
- allowing re-generation/versioning if needed

## Cover letter requirements

The cover letter generation should use:
- saved job data
- the selected tailored resume
- a bounded prompt template
- structured metadata about generation inputs

Store:
- content
- status
- created_at
- source job id
- source tailored resume id

## Application answer requirements

Application answers should support:
- one-off generation from free-text question input
- storage of generated answer and source context
- later revision if needed

## Implementation requirements

1. Create a cover letter service
2. Create an application answer service
3. Persist generated materials
4. Add validation and failure handling
5. Add tests for generation and storage
6. Make sure outputs are attributable to their source job/resume inputs

## Acceptance criteria

- A user can generate a cover letter for a saved job
- A user can generate an answer to a specific application question
- Outputs are stored and traceable
- Re-runs do not destroy history

## Out of scope

Do not export files in this issue.
Do not build end-to-end workflow orchestration in this issue.

## Deliverables

- cover letter generation service
- application answer generation service
- storage model
- tests
- minimal API/UI surfaces

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.
Keep generated text grounded in the persisted job and resume data.
EOF

create_issue "Stage 8: Implement DOCX/PDF export for resumes, cover letters, and packets" \
"job-coach-rebuild,stage-8,export,backend,testing" \
"stage-8-export-pipeline" <<'EOF'
## Summary

Implement real document export for the new job coach.

This stage should support exporting:
- tailored resumes
- cover letters
- application packets

The export layer must operate on persisted structured data from the new system, not on ad hoc prompt output.

## Goal

Create:
- exportResumeDocx
- exportResumePdf
- exportCoverLetterDocx
- exportApplicationPacketPdf or equivalent

## Scope

Support:
- DOCX export
- PDF export
- artifact metadata persistence
- repeatable export behavior
- stable file naming conventions

## Implementation requirements

1. Build a documents/export module
2. Convert structured resume data into a document template
3. Convert cover letter content into document template(s)
4. Support PDF generation from a reliable pipeline
5. Store exported artifact metadata in exported_artifacts
6. Add tests for successful export and metadata persistence

## Suggested artifact metadata

Store:
- artifact type
- source entity type
- source entity id
- created_at
- template/version info if relevant
- file path or object key
- checksum if useful

## Acceptance criteria

- A tailored resume can be exported to DOCX
- A tailored resume can be exported to PDF
- A cover letter can be exported
- Exported artifacts are tracked in the database
- Export results are deterministic enough for repeated use

## Out of scope

Do not build background job orchestration here unless absolutely required for export time.
Do not introduce unrelated template systems.

## Deliverables

- export module
- templates
- artifact tracking
- tests
- minimal usage docs

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.
Prefer a maintainable export pipeline over a clever one.
EOF

create_issue "Stage 9: Add workflow orchestration, background jobs, retries, and run history" \
"job-coach-rebuild,stage-9,infra,backend,ai,testing" \
"stage-9-workflow-orchestration" <<'EOF'
## Summary

Add workflow orchestration for the multi-step operations in the new job coach.

By this stage, the core features should already exist individually. This issue is about making them composable, retryable, and resumable as end-to-end workflows.

## Goal

Create reliable workflows for operations such as:
- import job from URL -> save -> score fit
- import job -> score fit -> generate tailored resume
- generate tailored resume -> generate cover letter -> export packet

## Scope

Implement:
- background job processing or queueing
- run history
- retries
- workflow state visibility
- failure handling
- resumable or restartable execution where reasonable

## Recommended approach

A simple queue is acceptable for this stage.
If a workflow engine is introduced, keep it narrowly scoped and justify the added complexity.

## Data requirements

Add workflow/run tracking such as:
- workflow_runs
- workflow_steps
or equivalent

Track:
- current status
- step status
- started_at / completed_at
- input references
- error details
- retry count

## Implementation requirements

1. Design workflow/run persistence
2. Add queue/background execution
3. Compose existing services into workflows
4. Add retry handling for transient failures
5. Add visibility into run status
6. Add tests for happy path and failure path behavior

## Acceptance criteria

- Multi-step workflows no longer require manual operator sequencing
- Failures are visible and debuggable
- Retrying does not corrupt persisted source data
- Run history is queryable

## Out of scope

Do not rebuild the app as a free-roaming autonomous agent.
Do not reintroduce prompt-based global routing.

## Deliverables

- queue or orchestration implementation
- run history persistence
- retry handling
- tests
- short architecture documentation

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.
Keep the workflow layer explicit and bounded.
EOF

create_issue "Stage 10: Migrate off OpenCode runtime assumptions and document the new operating model" \
"job-coach-rebuild,stage-10,migration,docs,testing" \
"stage-10-migration-and-docs" <<'EOF'
## Summary

Complete the migration away from the OpenCode-centric runtime model and document the new operating model for the rebuilt job coach.

This stage should make it clear that OpenCode is no longer the runtime engine for the job coach product. It may still be used as a developer tool, but not as the product execution model.

## Goal

Finalize migration by:
- removing or deprecating old runtime assumptions
- documenting the new architecture
- updating developer workflows
- ensuring tests and CI cover the new path

## Scope

Handle:
- identifying old job coach agent/skill dependencies that are now obsolete
- documenting what remains, if anything
- updating setup docs
- updating contributor docs
- validating CI/test coverage for the new architecture

## Migration requirements

At minimum:
- inventory old OpenCode job coach pieces
- decide which are retired vs retained for dev tooling
- document replacement mappings
- prevent confusion about which system is canonical

## Documentation requirements

Add docs covering:
- architecture overview
- data model overview
- how a job flows through the system
- how to run locally
- how to test
- how to add new AI-backed features safely
- what OpenCode is still used for, if anything

## Testing/CI requirements

- ensure the new app path is tested in CI
- ensure key services have automated coverage
- ensure migration decisions are reflected in docs/readme

## Acceptance criteria

- The new job coach architecture is the documented source of truth
- Developers can understand how to work on it without reading old agent prompts
- CI covers the new critical path
- Old job coach runtime assumptions are clearly retired or fenced off

## Out of scope

Do not add new product features in this issue.
This is a migration and documentation closeout issue.

## Deliverables

- migration inventory
- updated docs
- CI/test verification
- cleanup/deprecation changes where appropriate

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.
Do not skip the documentation work.
EOF

echo
echo "Done."
echo "Created labels and staged rebuild issues in $REPO"