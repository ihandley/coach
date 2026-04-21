# GitHub Issue #6

- Title: Stage 6: Generate tailoring suggestions and versioned tailored resumes
- State: OPEN
- Labels: job-coach-rebuild, stage-6, backend, ai, testing
- URL: https://github.com/ihandley/coach/issues/6
- Created: 2026-04-21T16:40:56Z
- Updated: 2026-04-21T16:40:56Z

## Body

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
