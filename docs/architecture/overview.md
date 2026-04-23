# Architecture Overview

Job Coach is a normal application with AI-assisted steps, not an OpenCode runtime shell.

## Goals

The rebuilt architecture is designed to be:

- explicit
- testable
- database-backed
- workflow-driven
- deterministic where practical
- safe for incremental product changes

## Layers

### Application surface

`apps/job-coach-web`

Responsible for:

- HTTP routes
- request validation
- app-facing server composition
- workflow visibility endpoints
- UI and product surface

### Core domain logic

`packages/core`

Responsible for:

- domain types
- workflow primitives
- export service contracts
- pure or mostly pure orchestration helpers
- reusable business logic

### Persistence

`packages/db`

Responsible for:

- repositories
- migrations
- persistence adapters
- database-backed implementations of application contracts

### Documentation and contributor guidance

- `README.md`
- `AGENT.md`
- `docs/*`
- `.ai/*`

These explain how the rebuilt system works and how contributors should extend it safely.

## Canonical state

Canonical state lives in structured persistence, not mutable OpenCode files.

Examples of canonical entities:

- jobs
- resume profiles
- resume versions
- cover letter drafts
- exported artifacts
- workflow runs
- workflow steps
- evaluations

Files are artifacts or docs, not the primary product state.

## Runtime model

The runtime model is:

1. API route receives an explicit request
2. server layer composes the needed services
3. core logic executes bounded behavior
4. repositories persist canonical state
5. workflows record visible run and step status
6. exports create deterministic artifacts

## AI-backed behavior

AI-backed behavior is allowed, but must remain bounded.

Rules:

- prompts are implementation details, not runtime architecture
- structured validation must happen before persistence
- workflows should remain explicit
- retries and failures should be visible
- canonical state should not depend on hidden agent behavior

## Current major flows

### Job import and evaluation

- import a job from URL
- persist the job
- score job fit against a resume profile

### Resume and cover letter generation

- generate tailored resume content
- create cover letter draft
- keep versioned structured records

### Export pipeline

- render resume / cover letter / packet
- emit deterministic file names
- track exported artifact metadata

### Workflow orchestration

- create workflow run
- execute explicit steps
- record step history
- retry bounded failures
- expose run status through API

## Why this replaced OpenCode runtime assumptions

The earlier OpenCode-centered model was useful for experimentation, but it made core product behavior too dependent on:

- prompt routing
- skill discovery
- hidden runtime behavior
- mutable file state

The rebuilt model makes behavior inspectable and maintainable through normal app code, persistence, tests, and documentation.

## Extension guidance

When adding new features:

- start from the workflow or service boundary
- define structured inputs and outputs
- persist canonical state explicitly
- add tests before broadening scope
- document new runtime assumptions in repo docs
