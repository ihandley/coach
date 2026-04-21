# GitHub Issue #5

- Title: Stage 5: Add resume profile ingest and baseline resume review
- State: OPEN
- Labels: job-coach-rebuild, stage-5, backend, ai, testing
- URL: https://github.com/ihandley/coach/issues/5
- Created: 2026-04-21T16:40:55Z
- Updated: 2026-04-21T16:40:55Z

## Body

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
