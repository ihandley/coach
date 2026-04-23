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

Mapped into the rebuilt `NormalizedResume` shape.

### Jobs

Legacy job entries become:

* job records
* application events derived from notes and dates where useful

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

## Deduping

Jobs are deduped by:

1. real source URL when present
2. otherwise `(company + title)`

## Running the import

Dry run first:

```bash
python3 scripts/import-legacy-opencode-data.py \
  --opencode-repo-root ../opencode-config \
  --dry-run
```
