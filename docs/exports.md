# Exports

The Job Coach export pipeline generates deterministic document artifacts from persisted structured data.

## Supported document types

- resume
- cover-letter
- application-packet

## Supported formats

- docx
- pdf

## API

### `POST /api/exports`

Request body:

```json
{
  "documentType": "resume",
  "format": "pdf",
  "resumeProfileId": "resume-profile-id",
  "resumeVersionId": "resume-version-id"
}
```

Resume export requires:

- `resumeProfileId`
- `resumeVersionId`

Cover letter export requires:

- `resumeProfileId`
- `coverLetterDraftId`

Example:

```json
{
  "documentType": "cover-letter",
  "format": "docx",
  "resumeProfileId": "resume-profile-id",
  "coverLetterDraftId": "cover-letter-draft-id"
}
```

Application packet export requires:

- `resumeProfileId`
- `resumeVersionId`
- `coverLetterDraftId`

Example:

```json
{
  "documentType": "application-packet",
  "format": "pdf",
  "resumeProfileId": "resume-profile-id",
  "resumeVersionId": "resume-version-id",
  "coverLetterDraftId": "cover-letter-draft-id"
}
```

## Response

Successful export responses return:

- binary file body
- `content-type` matching the requested format
- `content-disposition` with the generated file name

## Deterministic file naming

Generated files use stable names derived from source entity ids.

Examples:

- `resume-<resumeProfileId>-<resumeVersionId>.docx`
- `resume-<resumeProfileId>-<resumeVersionId>.pdf`
- `cover-letter-<resumeProfileId>-<coverLetterDraftId>.docx`
- `cover-letter-<resumeProfileId>-<coverLetterDraftId>.pdf`
- `application-packet-<resumeProfileId>-<resumeVersionId>-<coverLetterDraftId>.pdf`
- `application-packet-<resumeProfileId>-<resumeVersionId>-<coverLetterDraftId>.docx`

## Artifact metadata

Each export writes an `exported_artifacts` record with:

- `artifact_type`
- `source_entity_type`
- `source_entity_id`
- `file_name`
- `storage_path`
- `mime_type`
- `checksum_sha256`
- `byte_size`
- `created_at`

## Notes

- Export content is derived from persisted structured data, not ad hoc prompt output.
- PDF generation is deterministic for repeated exports from the same input.
- Application packets combine the cover letter and resume into a single exported artifact.
