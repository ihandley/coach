# Stage 11: Import legacy Job Coach JSON data from OpenCode into the rebuilt app

## GitHub Issue
- Number: #23

## Body

## Title
Migrate legacy OpenCode resume and job data into new system

---

## Summary

Implements a one-time migration path for importing legacy Job Coach data from the OpenCode repository into the new structured system.

This includes:

- baseline resume → resume profile + version  
- jobs → structured job records  
- notes, applied dates, and history → application events  

The import is idempotent and safe to rerun.

---

## What was built

### Import script

- scripts/import-legacy-opencode-data.py
  - Reads:
    - data/job-coach/resume.json
    - data/job-coach/jobs.json
    - data/jobs.json
  - Maps legacy data into new schema
  - Writes directly to Supabase using service role key

---

### Resume migration

- Creates a resume profile
- Creates a baseline resume version
- Uses:
  - kind: baseline
  - source.kind: legacy_import
- Normalizes:
  - basics (name, headline, summary)
  - skills
  - experience → highlights
  - education

Idempotency:
- Reuses existing profile by name
- Reuses existing baseline version if already imported

---

### Job migration

- Imports jobs into jobs table
- Deduplicates using:
  - sourceUrl (preferred)
  - fallback identifiers when missing

Maps:
- company
- title
- description → sourceText
- status → mapped to system enum

---

### Application history

Preserves legacy tracking via application_events:

- saved date → note_added
- applied date → status_changed
- notes → note_added
- email updates → note_added

This maintains timeline/history for each job.

---

### Idempotency guarantees

- Resume:
  - profile reused if exists
  - baseline version reused if already imported

- Jobs:
  - existing jobs skipped (no duplicates)
  - safe to rerun multiple times

---

### Database changes

Added:

- resume_profiles
- resume_versions

Update:

- resume_profiles.current_version_id made nullable to support correct creation order

---

## Validation

- Imported:
  - 1 resume profile
  - 1 baseline resume version
  - 46 jobs
- Rerun confirmed:
  - 0 new jobs created
  - all jobs skipped correctly
  - resume reused

---

## Notes / Limitations

- Some legacy jobs lacked IDs
  - fallback logic used for deduplication
- Not all legacy fields are mapped (by design)
  - system only imports data relevant to current workflows

---

## Acceptance Criteria

- [x] resume.json → baseline resume profile + version  
- [x] jobs imported correctly  
- [x] duplicate imports are safe  
- [x] mappings documented  
- [x] skipped fields documented  
- [x] tests pass  

---

## How to run

bash source .venv/bin/activate  export SUPABASE_URL="http://127.0.0.1:54321" export SUPABASE_SERVICE_ROLE_KEY="<service_role_key>"  python3 scripts/import-legacy-opencode-data.py \   --opencode-repo-root ../opencode 
