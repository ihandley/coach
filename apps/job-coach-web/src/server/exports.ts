import { createExport, createExportService } from "@coach/core";

export function createExportsServer() {
    const exportService = createExportService({
        renderers: {
            renderResume: async ({ format }) => ({
                fileName: format === "docx" ? "resume.docx" : "resume.pdf",
                mimeType:
                    format === "docx"
                        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        : "application/pdf",
                buffer: new ArrayBuffer(0),
            }),
            renderCoverLetter: async ({ format }) => ({
                fileName: format === "docx" ? "cover-letter.docx" : "cover-letter.pdf",
                mimeType:
                    format === "docx"
                        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        : "application/pdf",
                buffer: new ArrayBuffer(0),
            }),
            renderApplicationPacket: async ({ format }) => ({
                fileName:
                    format === "docx"
                        ? "application-packet.docx"
                        : "application-packet.pdf",
                mimeType:
                    format === "docx"
                        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        : "application/pdf",
                buffer: new ArrayBuffer(0),
            }),
        },
    });

    const exportDocument = createExport({
        exportResume: ({ format, resumeProfileId, resumeVersionId }) =>
            exportService.exportResume({
                format,
                resumeProfileId,
                resumeVersionId: resumeVersionId!,
            }),
        exportCoverLetter: ({ format, resumeProfileId, coverLetterDraftId }) =>
            exportService.exportCoverLetter({
                format,
                resumeProfileId,
                coverLetterDraftId: coverLetterDraftId!,
            }),
        exportApplicationPacket: ({
            format,
            resumeProfileId,
            resumeVersionId,
            coverLetterDraftId,
        }) =>
            exportService.exportApplicationPacket({
                format,
                resumeProfileId,
                resumeVersionId: resumeVersionId!,
                coverLetterDraftId: coverLetterDraftId!,
            }),
    });

    return {
        exportDocument,
    };
}