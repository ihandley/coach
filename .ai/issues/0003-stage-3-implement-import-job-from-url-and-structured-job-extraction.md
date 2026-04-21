# GitHub Issue #3

- Title: Stage 3: Implement import job from URL and structured job extraction
- State: OPEN
- Labels: job-coach-rebuild, stage-3, backend, ai, testing
- URL: https://github.com/ihandley/coach/issues/3
- Created: 2026-04-21T16:40:53Z
- Updated: 2026-04-21T16:40:53Z

## Body

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
