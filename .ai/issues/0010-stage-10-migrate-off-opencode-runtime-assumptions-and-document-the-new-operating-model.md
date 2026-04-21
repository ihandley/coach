# GitHub Issue #10

- Title: Stage 10: Migrate off OpenCode runtime assumptions and document the new operating model
- State: OPEN
- Labels: job-coach-rebuild, stage-10, docs, migration, testing
- URL: https://github.com/ihandley/coach/issues/10
- Created: 2026-04-21T16:41:01Z
- Updated: 2026-04-21T16:41:01Z

## Body

## Summary

Complete the migration away from the OpenCode-centric runtime model and document the new operating model for the rebuilt job coach.

This stage should make it clear that OpenCode is no longer the runtime engine for the job coach product. It may still be used as a developer tool, but not as the product execution model.

## Goal

Finalize migration by:
- removing or deprecating old runtime assumptions
- documenting the new architecture
- updating developer workflows
- ensuring tests and CI cover the new path

## Scope

Handle:
- identifying old job coach agent/skill dependencies that are now obsolete
- documenting what remains, if anything
- updating setup docs
- updating contributor docs
- validating CI/test coverage for the new architecture

## Migration requirements

At minimum:
- inventory old OpenCode job coach pieces
- decide which are retired vs retained for dev tooling
- document replacement mappings
- prevent confusion about which system is canonical

## Documentation requirements

Add docs covering:
- architecture overview
- data model overview
- how a job flows through the system
- how to run locally
- how to test
- how to add new AI-backed features safely
- what OpenCode is still used for, if anything

## Testing/CI requirements

- ensure the new app path is tested in CI
- ensure key services have automated coverage
- ensure migration decisions are reflected in docs/readme

## Acceptance criteria

- The new job coach architecture is the documented source of truth
- Developers can understand how to work on it without reading old agent prompts
- CI covers the new critical path
- Old job coach runtime assumptions are clearly retired or fenced off

## Out of scope

Do not add new product features in this issue.
This is a migration and documentation closeout issue.

## Deliverables

- migration inventory
- updated docs
- CI/test verification
- cleanup/deprecation changes where appropriate

## Notes for ChatGPT when implementing this issue

Use a step-by-step approach.
Do not skip the documentation work.
