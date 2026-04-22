import { createExport } from "@coach/core";

const exportDocument = createExport({
    exportResume: async () => ({
        fileName: "resume.docx",
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: new ArrayBuffer(0),
    }),
    exportCoverLetter: async () => ({
        fileName: "cover-letter.pdf",
        mimeType: "application/pdf",
        buffer: new ArrayBuffer(0),
    }),
    exportApplicationPacket: async () => ({
        fileName: "application-packet.pdf",
        mimeType: "application/pdf",
        buffer: new ArrayBuffer(0),
    }),
});

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function isDocumentType(
    value: unknown,
): value is "resume" | "cover-letter" | "application-packet" {
    return (
        value === "resume" ||
        value === "cover-letter" ||
        value === "application-packet"
    );
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

    if (
        candidate.documentType === "resume" &&
        !isNonEmptyString(candidate.resumeVersionId)
    ) {
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
            isNonEmptyString(candidate.resumeVersionId) &&
            isNonEmptyString(candidate.coverLetterDraftId)
        );
    }

    return true;
}

export async function POST(request: Request) {
    const body = await request.json();

    if (!isValidExportBody(body)) {
        return Response.json({ error: "INVALID_EXPORT_INPUT" }, { status: 400 });
    }

    const result = await exportDocument(body);

    return new Response(result.buffer, {
        status: 200,
        headers: {
            "content-type": result.mimeType,
            "content-disposition": `attachment; filename="${result.fileName}"`,
        },
    });
}