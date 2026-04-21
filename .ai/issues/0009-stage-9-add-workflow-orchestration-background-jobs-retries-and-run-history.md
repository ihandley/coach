# GitHub Issue #9

- Title: Stage 9: Add workflow orchestration, background jobs, retries, and run history
- State: OPEN
- Labels: job-coach-rebuild, stage-9, backend, ai, infra, testing
- URL: https://github.com/ihandley/coach/issues/9
- Created: 2026-04-21T16:40:59Z
- Updated: 2026-04-21T16:40:59Z

## Body

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
