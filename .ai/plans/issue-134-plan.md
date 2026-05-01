# Issue 134 – Complete PDF Resume Import Workflow

## Objective

Finish the AI-assisted PDF resume import so all acceptance criteria are satisfied.

## 1. Add AI normalization

Update:

- `packages/core/src/resumes/import/import-resume-from-text.ts`

Requirements:

- Reject empty or whitespace-only text.
- Replace placeholder normalization with AI-based normalization.
- Use dependency injection. Do not hardcode the AI call inside the import function.

Target dependency shape:

```ts
type NormalizeResume = (text: string) => Promise<NormalizedResume>;
```

Expected flow:

1. Validate input text.
2. Call `normalizeResume(text)`.
3. Validate the returned normalized resume structure.
4. Call the existing `createResumeProfile(...)` pipeline.

Do not bypass existing profile/version creation logic.

## 2. Fix source metadata

Imported PDF resumes should create their baseline version with the original PDF filename:

```ts
source: {
  kind: "pdf",
  label: input.name,
}
```

Plumb the original filename through:

- UI upload
- API route
- PDF import
- text import

Remove hardcoded source values like:

```ts
kind: "import"
label: "text-import"
```

## 3. Harden the API route

Update:

- `apps/job-coach-web/src/app/api/resume-profiles/import/route.ts`

Add validation and error handling for:

- non-PDF files
- malformed or unreadable PDFs
- PDFs that extract to empty text
- AI normalization failures

Expected behavior:

- Return a clear error response.
- Show a user-visible error in the UI.
- Do not create partial resume records on failure.

## 4. Add unit tests

Update or create tests in:

- `packages/core/src/resumes/import`

Required cases:

- successful import creates a profile
- successful import creates a baseline version
- successful import sets `currentVersionId`
- successful import stores source `{ kind: "pdf", label: filename }`
- empty text throws
- AI normalization failure throws cleanly

## 5. Add Playwright coverage

Update:

- `apps/job-coach-web/tests/resume-import.spec.ts`

Required tests:

- valid PDF upload from `/resumes` succeeds
- invalid file type shows an error
- empty PDF shows an error
- malformed PDF shows an error if practical with current test helpers
- imported resume appears in `/resumes`
- imported resume appears in the job tailoring resume dropdown
- Tailor Resume can select/use the imported resume without manual DB inserts

## 6. Verify integration

Before closing the issue, verify manually or via tests:

- `/resumes` upload works
- resume list updates after import
- job page dropdown includes the imported resume
- Tailor Resume executes using the imported resume

## 7. Run tests

Inspect `package.json` scripts first if these commands do not exist.

```bash
pnpm test
pnpm --filter job-coach-web test:e2e
```

## Done criteria

All must be true before closing Issue 134:

- PDF upload works from `/resumes`.
- App creates a usable resume profile and baseline version.
- `resume_profiles.current_version_id` is set.
- Baseline version source is `{ kind: "pdf", label: originalFilename }`.
- Resume appears in `/resumes`.
- Resume appears in the job tailoring dropdown.
- Tailor Resume can use the imported resume without manual DB inserts.
- Invalid file, empty extraction, malformed PDF, and AI failure paths are handled cleanly.
