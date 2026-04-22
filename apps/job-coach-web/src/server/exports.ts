import { createExport, createExportService } from "@coach/core";
import {
    createDbGetResumeProfile,
    createDbResumeVersionRepository,
} from "@coach/db";
import { renderResumeDocx } from "./resume-docx-renderer";

export function createExportsServer(dependencies?: {
    resumeProfiles?: {
        getResumeProfileById(resumeProfileId: string): Promise<any>;
    };
    resumeVersions?: {
        getResumeVersionById(resumeVersionId: string): Promise<any>;
    };
    renderResumeDocx?: typeof renderResumeDocx;
}) {
    const resumeProfiles = dependencies?.resumeProfiles ?? {
        async getResumeProfileById() {
            throw new Error("RESUME_PROFILE_REPOSITORY_NOT_CONFIGURED");
        },
    };

    const resumeVersions = dependencies?.resumeVersions ?? {
        async getResumeVersionById() {
            throw new Error("RESUME_VERSION_REPOSITORY_NOT_CONFIGURED");
        },
    };

    const renderResumeDocxImpl =
        dependencies?.renderResumeDocx ?? renderResumeDocx;

    const exportService = createExportService({
        renderers: {
            renderResume: async ({ format, data }) => {
                if (format === "docx") {
                    const profile = await resumeProfiles.getResumeProfileById(
                        data.resumeProfileId,
                    );
                    const version = await resumeVersions.getResumeVersionById(
                        data.resumeVersionId,
                    );

                    return renderResumeDocxImpl({
                        resumeProfileId: data.resumeProfileId,
                        resumeVersionId: data.resumeVersionId,
                        content: {
                            name: profile.name,
                            headline: version.normalizedResume?.headline,
                            summary: version.normalizedResume?.summary,
                            experience: version.normalizedResume?.experience ?? [],
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