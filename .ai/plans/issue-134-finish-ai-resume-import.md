# Issue 134 — Finish AI-Assisted Resume Import Workflow

## Goal

Complete and stabilize the resume import pipeline so it is production-ready:

* Reliable PDF parsing
* Structured resume normalization
* Correct database persistence
* Clean preview UX
* Full test coverage

***

## 1. Fix PDF parsing (critical)

### Problem

Current implementation uses unsafe fallback parsing (e.g. buffer.toString).

### Task

* Replace with `pdfjs-dist`
* Extract text from all PDF pages server-side
* Normalize whitespace and remove artifacts

### Acceptance Criteria

* Real PDF resumes parse correctly
* No binary/gibberish text appears in output

***

## 2. Normalize resume structure

### Task

Implement deterministic normalization layer:

Output schema:

* basics (name, email, phone optional)
* skills (string\[])
* experience (structured array)
* education (structured array)
* rawText (full extracted text)

### Acceptance Criteria

* Always returns valid structure even without AI

***

## 3. Optional AI enhancement layer

### Task

Add separate module:

* `/lib/resume/ai-normalizer.ts`

Behavior:

* Takes rawText
* Returns structured resume JSON
* Must be optional / feature-flagged

### Acceptance Criteria

* Can be disabled without breaking pipeline

***

## 4. Fix preview UX

### Task

Replace raw JSON preview with structured UI:

* Header (name/contact)
* Skills section
* Experience section
* Education section

### Acceptance Criteria

* No raw JSON shown to users
* Clean readable layout

***

## 5. Ensure DB consistency

### Task

Guarantee:

* resume\_profiles always created
* resume\_versions always created and linked
* no orphan records

### Add safeguard:

* fail request if version insert fails

***

## 6. Testing requirements

### Unit tests

* PDF parsing produces text
* normalization produces expected structure

### Integration tests (Vitest)

* POST /resume-profiles creates profile + version
* GET /api/resume-profiles/:id returns structured JSON used by preview modal

### Playwright E2E tests

* Upload resume
* Verify list update
* Open preview modal
* Validate structured output
* Delete resume and confirm removal

***

## Definition of Done

* \[x] PDF import works reliably
* \[x] Structured resume output exists
* \[x] Preview is UI-friendly (not JSON)
* \[x] Delete works instantly
* \[x] No runtime errors
* \[x] Unit + integration + E2E tests passing
