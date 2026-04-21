# GitHub Issue #8

- Title: Stage 8: Implement DOCX/PDF export for resumes, cover letters, and packets
- State: OPEN
- Labels: job-coach-rebuild, stage-8, backend, export, testing
- URL: https://github.com/ihandley/coach/issues/8
- Created: 2026-04-21T16:40:58Z
- Updated: 2026-04-21T16:40:58Z

## Body

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
