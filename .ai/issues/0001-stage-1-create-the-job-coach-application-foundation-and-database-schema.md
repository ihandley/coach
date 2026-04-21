# GitHub Issue #1

- Title: Stage 1: Create the job coach application foundation and database schema
- State: OPEN
- Labels: job-coach-rebuild, stage-1, backend, infra, testing
- URL: https://github.com/ihandley/coach/issues/1
- Created: 2026-04-21T16:40:50Z
- Updated: 2026-04-21T16:40:50Z

## Body

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
