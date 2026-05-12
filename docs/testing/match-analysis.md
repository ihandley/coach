## Functional Test Plan

### 1. Verify Jobs page still loads

* Open `/jobs`
* Confirm the jobs table loads without errors
* Confirm existing jobs still show:
  * title
  * company
  * status
  * fit score
  * source link

Expected: no runtime error, no missing table data.

***

### 2. Verify existing matched jobs show Match Details

* Expand a matched job
* Open the Match Details tab
* Confirm it shows:
  * recommendation
  * strengths
  * gaps
  * reasoning/details

Expected: content is role-specific and does not say “Good keyword overlap.”

***

### 3. Verify unmatched jobs still behave gracefully

* Find a job with `Not matched`
* Expand it
* Open Match Details

Expected: no crash. It should show a clear empty/fallback state.

***

### 4. Verify fit scores did not change unexpectedly

* Compare a few known jobs’ fit scores before/after if you remember them
* Confirm high-fit jobs still sort above low-fit jobs

Expected: score display and ranking feel unchanged.

***

### 5. Verify new match details are generated

* Pick a job
* Run/re-run matching for it
* Expand it
* Open Match Details

Expected: new recommendation/strengths/gaps are more specific than the old generic wording.

***

### 6. Verify import flow still works

* Import a new job URL
* Confirm the job appears at the top/list
* Confirm it receives a match score
* Expand it and check Match Details

Expected: import still works and creates match details.

***

### 7. Verify re-import still works

* Open an existing job with a real source URL
* Use Re-import from URL
* Preview changes
* Save
* Confirm job data updates
* Confirm Match Details still render

Expected: re-import does not break matching or job details.

***

### 8. Verify no old generic wording appears

Search visible Match Details for:

* `Good keyword overlap`
* `Low keyword overlap`
* `Saved fit score suggests`
* `Fit analysis is based on the saved match score`

Expected: none of those appear in normal rendered UI.

***

### 9. Verify fallback behavior for legacy matches

* Look at older matched jobs that existed before this PR
* Expand Match Details

Expected: they still show useful fallback details, not blank/broken UI.

***

### 10. Verify console/network

* Open browser dev tools
* Refresh `/jobs`
* Expand a few jobs
* Check console and network errors

Expected: no 500s from `/api/jobs/ranked`, no frontend runtime errors.
