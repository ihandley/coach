# GitHub Issue #4

- Title: Stage 4: Build fit scoring and recommendation engine
- State: OPEN
- Labels: job-coach-rebuild, stage-4, backend, ai, testing
- URL: https://github.com/ihandley/coach/issues/4
- Created: 2026-04-21T16:40:54Z
- Updated: 2026-04-21T16:40:54Z

## Body

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
