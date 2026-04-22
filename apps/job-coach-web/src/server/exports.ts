import { createExport, createExportService } from "@coach/core";
import {
    createDbResumeProfileRepository,
    createDbResumeVersionRepository,
} from "@coach/db";
import { createServerClient } from "@coach/db";
import { renderResumeDocx } from "./resume-docx-renderer";
import { renderResumePdf } from "./resume-pdf-renderer";

export function createExportsServer(dependencies?: {
    resumeProfiles?: {
        getResumeProfileById(resumeProfileId: string): Promise<any>;
    };
    resumeVersions?: {
        getResumeVersionById(resumeVersionId: string): Promise<any>;
    };
    renderResumeDocx?: typeof renderResumeDocx;
    renderResumePdf?: typeof renderResumePdf;
}) {
    const db =
        dependencies?.resumeProfiles && dependencies?.resumeVersions
            ? null
            : createServerClient();

    const resumeProfiles =
        dependencies?.resumeProfiles ??
        createDbResumeProfileRepository({ db: db! });

    const resumeVersions =
        dependencies?.resumeVersions ??
        createDbResumeVersionRepository({ db: db! });

    const renderResumeDocxImpl =
        dependencies?.renderResumeDocx ?? renderResumeDocx;

    const renderResumePdfImpl =
        dependencies?.renderResumePdf ?? renderResumePdf;

    const exportService = createExportService({
        renderers: {
            renderResume: async ({ format, data }) => {
                const profile = await resumeProfiles.getResumeProfileById(
                    data.resumeProfileId,
                );
                const version = await resumeVersions.getResumeVersionById(
                    data.resumeVersionId,
                );

                const content = {
                    name: profile?.name ?? "Resume",
                    headline: version?.normalizedResume?.headline,
                    summary: version?.normalizedResume?.summary,
                    experience: version?.normalizedResume?.experience ?? [],
                };

                if (format === "docx") {
                    return renderResumeDocxImpl({
                        resumeProfileId: data.resumeProfileId,
                        resumeVersionId: data.resumeVersionId,
                        content,
                    });
                }

                return renderResumePdfImpl({
                    resumeProfileId: data.resumeProfileId,
                    resumeVersionId: data.resumeVersionId,
                    content,
                });
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