# GitHub Issue #7

- Title: Stage 7: Build cover letter drafting and application question answering
- State: OPEN
- Labels: job-coach-rebuild, stage-7, backend, ai, testing
- URL: https://github.com/ihandley/coach/issues/7
- Created: 2026-04-21T16:40:57Z
- Updated: 2026-04-21T16:40:57Z

## Body

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
