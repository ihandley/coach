# Legacy OpenCode Data Import

This migration imports only the remaining legacy JSON data that still matters for the rebuilt Job Coach.

## Source files

* `data/job-coach/jobs.json`
* `data/jobs.json`
* `data/job-coach/resume.json`

## Imported entities

### Resume

The legacy `resume.json` becomes:

* one resume profile
* one baseline resume version

### Jobs

Legacy job entries become:

* job records
* application events derived from saved/applied dates and legacy notes

## Not imported

The migration does not import:

* agents
* skills
* commands
* instructions
* legacy docx/pdf artifacts
* legacy tailored resumes
* legacy cover letters

## Status mapping

Legacy job statuses are mapped as follows:

* `saved` → `saved`
* `researching` → `researching`
* `applying` → `applying`
* `applied` → `applied`
* `under_review` → `applied`
* `awaiting_opportunity` → `researching`
* `interviewing` → `interviewing`
* `offer` → `offer`
* `rejected` → `rejected`
* `withdrawn` → `withdrawn`
* `archived` → `archived`
* anything else → `saved`

## Dedupe rules

Jobs are deduped by:

1. `source_url` when present
2. otherwise `(company + title)`

## Idempotency rules

### Resume

* if the resume profile already exists by name, reuse it
* if a baseline version already exists with:
  * `source_kind = legacy_import`
  * `source_label = Legacy OpenCode resume import`
    then do not create another one

### Jobs

* skip jobs already present by `source_url`
* if the job uses a generated `legacy://...` source URL, fall back to `(company + title)`

### Events

Legacy events are created only for newly imported jobs.

## Required environment variables

```bash
export SUPABASE_URL="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
```
