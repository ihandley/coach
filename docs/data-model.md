# Data Model Overview

This document summarizes the rebuilt Job Coach data model at a high level.

## Principles

- canonical data is structured
- persistence is explicit
- workflows and artifacts are first-class
- source entities are preserved across derived outputs

## Core entities

### Jobs

Represents imported or manually tracked job opportunities.

Typical responsibilities:

- store source URL
- store normalized job text/data
- track application status
- support dashboard and timeline views

### Resume profiles

Represents the logical resume identity for a user.

Typical responsibilities:

- stable profile id
- human-facing name
- current active version reference

### Resume versions

Represents baseline and tailored resume revisions.

Typical responsibilities:

- preserve version history
- track baseline vs tailored variants
- retain lineage to source version or job

### Cover letter drafts

Represents generated or edited cover letters tied to a resume profile and job.

Typical responsibilities:

- preserve draft content
- support export
- support workflow composition

### Evaluations

Represents job-fit scoring output for a job and resume profile pair.

Typical responsibilities:

- score
- recommendation
- reasoning
- chronological history

### Exported artifacts

Represents generated files such as:

- resume exports
- cover letter exports
- application packets

Tracked metadata includes:

- artifact type
- source entity type
- source entity id
- file name
- storage path
- mime type
- checksum
- byte size
- creation time

### Workflow runs

Represents a single execution of a multi-step process.

Tracked metadata includes:

- workflow type
- current status
- input references
- current step key
- error details
- retry count
- timestamps

### Workflow steps

Represents an individual step within a workflow run.

Tracked metadata includes:

- step key
- step status
- attempt count
- error details
- timestamps

## Derived vs canonical data

Canonical structured records include:

- jobs
- resume profiles
- resume versions
- cover letter drafts
- evaluations
- workflow runs
- workflow steps
- exported artifact metadata

Derived artifacts include:

- exported DOCX files
- exported PDF files

Derived artifacts are tracked, but they are not the only source of truth for the entities they represent.

## Migration note

Older OpenCode-era approaches often relied on mutable files and runtime prompt behavior.

The rebuilt data model replaces that with:

- typed application entities
- database-backed persistence
- explicit lineage and workflow history
- trackable artifacts and retries

## Future evolution

Likely future additions may include:

- richer workflow input typing
- resume-to-job linkage tables
- application submission tracking
- durable external queue metadata
- UI-oriented projections for run history
