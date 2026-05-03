function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isDocumentType(value: unknown): value is "resume" | "cover-letter" | "application-packet" {
  return value === "resume" || value === "cover-letter" || value === "application-packet";
}

function isFormat(value: unknown): value is "pdf" | "docx" {
  return value === "pdf" || value === "docx";
}

function isValidExportBody(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as {
    documentType?: unknown;
    format?: unknown;
    resumeProfileId?: unknown;
    resumeVersionId?: unknown;
    coverLetterDraftId?: unknown;
  };

  if (
    !isDocumentType(candidate.documentType) ||
    !isFormat(candidate.format) ||
    !isNonEmptyString(candidate.resumeProfileId)
  ) {
    return false;
  }

  if (candidate.documentType === "resume" && !isNonEmptyString(candidate.resumeVersionId)) {
    return false;
  }

  if (
    candidate.documentType === "cover-letter" &&
    !isNonEmptyString(candidate.coverLetterDraftId)
  ) {
    return false;
  }

  if (candidate.documentType === "application-packet") {
    return (
      isNonEmptyString(candidate.resumeVersionId) && isNonEmptyString(candidate.coverLetterDraftId)
    );
  }

  return true;
}

function createExportErrorResponse(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message === "RESUME_PROFILE_NOT_FOUND" ||
      error.message === "RESUME_VERSION_NOT_FOUND" ||
      error.message === "COVER_LETTER_NOT_FOUND"
    ) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    if (error.message === "RESUME_VERSION_PROFILE_MISMATCH") {
      return Response.json({ error: error.message }, { status: 400 });
    }
  }

  console.error("Export failed", error);

  return Response.json({ error: "EXPORT_FAILED" }, { status: 500 });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!isValidExportBody(body)) {
    return Response.json({ error: "INVALID_EXPORT_INPUT" }, { status: 400 });
  }

  const { createExportsServer } = await import("../../../server/exports");
  const { exportDocument } = createExportsServer();

  try {
    const result = await exportDocument(body);

    return new Response(result.buffer, {
      status: 200,
      headers: {
        "content-type": result.mimeType,
        "content-disposition": `attachment; filename="${result.fileName}"`,
      },
    });
  } catch (error) {
    return createExportErrorResponse(error);
  }
}
