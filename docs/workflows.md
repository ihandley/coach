# Workflows

The workflow layer coordinates multi-step operations using explicit persisted runs and steps.

## Goals

- make multi-step operations composable
- preserve run history
- surface step-by-step status
- support retries for transient failures
- avoid corrupting source data on retry

## Data model

### `workflow_runs`

Tracks the overall workflow execution.

Fields:

- `id`
- `workflow_type`
- `status`
- `input`
- `current_step_key`
- `error_message`
- `retry_count`
- `started_at`
- `completed_at`
- `created_at`

### `workflow_steps`

Tracks each step inside a workflow run.

Fields:

- `id`
- `workflow_run_id`
- `step_key`
- `status`
- `attempt_count`
- `error_message`
- `started_at`
- `completed_at`
- `created_at`

## Execution model

Workflows are defined as an ordered list of explicit steps.

Current execution flow:

1. create a `workflow_run`
2. enqueue the run in the workflow queue
3. process each step in order
4. persist step state transitions
5. retry failed steps up to the configured maximum
6. mark the run as succeeded or failed

## Queue model

The current queue is intentionally simple.

- in-process
- FIFO
- explicit step execution
- bounded retry handling
- no autonomous routing

This keeps the orchestration layer narrow and understandable while still supporting background-style execution flow.

## Retry behavior

Retries are handled per step.

- each step tracks `attempt_count`
- transient failures can be retried
- exhausted retries mark the step as failed
- failed steps mark the workflow run as failed
- failure details are persisted for debugging

## Current workflow

### `import-job-and-score-fit`

Steps:

1. `import-job`
2. `score-fit`

Input:

- `sourceUrl`
- `resumeProfileId`

Behavior:

- imports a job from URL
- uses the imported job id to run fit scoring
- records step history and failures
- exposes final run and step state through API routes

## Server layer

The server layer composes orchestration with existing services.

- `importJobFromUrl` from the jobs server
- `scoreJobFit` from the evaluations server
- DB-backed workflow repository for persisted run history

## API

### `POST /api/workflows`

Starts a workflow.

Currently supported:

- `import-job-and-score-fit`

### `GET /api/workflows`

Lists workflow runs.

### `GET /api/workflows/[workflowRunId]`

Returns a workflow run and its steps.

## Design constraints

- workflows remain explicit and bounded
- orchestration is built on persisted structured data
- retries must not invent or overwrite unrelated data
- debugging should rely on persisted state, not logs alone

## Next evolution options

Possible follow-up improvements:

- durable out-of-process queue worker
- delayed retry scheduling
- additional workflow types
- workflow restart from last failed step
- UI for run history and step visibility
