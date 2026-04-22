import { createExport, createExportService } from "@coach/core";
import { renderResumeDocx } from "./resume-docx-renderer";

export function createExportsServer() {
    const exportService = createExportService({
        renderers: {
            renderResume: async ({ format, data }) => {
                if (format === "docx") {
                    return renderResumeDocx({
                        resumeProfileId: data.resumeProfileId,
                        resumeVersionId: data.resumeVersionId,
                        content: {
                            name: "Jane Doe",
                            headline: "Senior Software Engineer",
                            summary: "Builds reliable product systems.",
                            experience: [
                                {
                                    company: "Acme",
                                    title: "Engineer",
                                    bullets: ["Built APIs", "Improved reliability"],
                                },
                            ],
                        },
                    });
                }

                return {
                    fileName: "resume.pdf",
                    mimeType: "application/pdf",
                    buffer: new ArrayBuffer(0),
                };
            },

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