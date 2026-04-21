# GitHub Issue #2

- Title: Stage 2: Build job tracking CRUD, timeline, and dashboard
- State: OPEN
- Labels: job-coach-rebuild, stage-2, backend, frontend, testing
- URL: https://github.com/ihandley/coach/issues/2
- Created: 2026-04-21T16:40:51Z
- Updated: 2026-04-21T16:40:51Z

## Body

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
