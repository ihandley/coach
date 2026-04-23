import { createHash } from "node:crypto";
import { createExport, createExportService, type ExportFormat } from "@coach/core";
import {
    createDbExportedArtifactRepository,
    createDbGetCoverLetterDraft,
    createDbResumeProfileRepository,
    createDbResumeVersionRepository,
} from "@coach/db";
import { createServerClient } from "@coach/db";
import { renderApplicationPacketDocx } from "./application-packet-docx-renderer";
import { renderApplicationPacketPdf } from "./application-packet-pdf-renderer";
import { renderCoverLetterDocx } from "./cover-letter-docx-renderer";
import { renderCoverLetterPdf } from "./cover-letter-pdf-renderer";
import { renderResumeDocx } from "./resume-docx-renderer";
import { renderResumePdf } from "./resume-pdf-renderer";

function checksum(buffer: ArrayBuffer) {
    return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

function size(buffer: ArrayBuffer) {
    return new Uint8Array(buffer).byteLength;
}

function fileExtension(format: ExportFormat) {
    return format;
}

export function createExportsServer(dependencies?: {
    resumeProfiles?: {
        getResumeProfileById(resumeProfileId: string): Promise<any>;
    };
    resumeVersions?: {
        getResumeVersionById(resumeVersionId: string): Promise<any>;
    };
    coverLetters?: {
        getCoverLetterDraftById(id: string): Promise<any>;
    };
    artifacts?: {
        createExportedArtifact(input: {
            artifactType: string;
            sourceEntityType: string;
            sourceEntityId: string;
            fileName: string;
            storagePath: string;
            mimeType: string;
            checksumSha256: string;
            byteSize: number;
        }): Promise<any>;
    };
    renderResumeDocx?: typeof renderResumeDocx;
    renderResumePdf?: typeof renderResumePdf;
}) {
    const db =
        dependencies?.resumeProfiles &&
            dependencies?.resumeVersions &&
            dependencies?.coverLetters &&
            dependencies?.artifacts
            ? null
            : createServerClient();

    const resumeProfiles =
        dependencies?.resumeProfiles ??
        createDbResumeProfileRepository({ db: db! });

    const resumeVersions =
        dependencies?.resumeVersions ??
        createDbResumeVersionRepository({ db: db! });

    const coverLetters =
        dependencies?.coverLetters ??
        createDbGetCoverLetterDraft({ db: db! });

    const artifacts =
        dependencies?.artifacts ??
        createDbExportedArtifactRepository({ db: db! });

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

                const rendered =
                    format === "docx"
                        ? await renderResumeDocxImpl({
                            resumeProfileId: data.resumeProfileId,
                            resumeVersionId: data.resumeVersionId,
                            content,
                        })
                        : await renderResumePdfImpl({
                            resumeProfileId: data.resumeProfileId,
                            resumeVersionId: data.resumeVersionId,
                            content,
                        });

                const fileName = `resume-${data.resumeProfileId}-${data.resumeVersionId}.${fileExtension(format)}`;
                const storagePath = `exports/resume-profiles/${data.resumeProfileId}/resume-versions/${data.resumeVersionId}/${fileName}`;

                await artifacts.createExportedArtifact({
                    artifactType: "resume",
                    sourceEntityType: "resume_version",
                    sourceEntityId: data.resumeVersionId,
                    fileName,
                    storagePath,
                    mimeType: rendered.mimeType,
                    checksumSha256: checksum(rendered.buffer),
                    byteSize: size(rendered.buffer),
                });

                return {
                    ...rendered,
                    fileName,
                };
            },

            renderCoverLetter: async ({ format, data }) => {
                const draft = await coverLetters.getCoverLetterDraftById(
                    data.coverLetterDraftId,
                );

                if (!draft) {
                    throw new Error("COVER_LETTER_NOT_FOUND");
                }

                const rendered =
                    format === "docx"
                        ? await renderCoverLetterDocx({
                            content: draft.content,
                        })
                        : await renderCoverLetterPdf({
                            content: draft.content,
                        });

                const fileName = `cover-letter-${data.resumeProfileId}-${data.coverLetterDraftId}.${fileExtension(format)}`;
                const storagePath = `exports/resume-profiles/${data.resumeProfileId}/cover-letter-drafts/${data.coverLetterDraftId}/${fileName}`;

                await artifacts.createExportedArtifact({
                    artifactType: "cover-letter",
                    sourceEntityType: "cover_letter_draft",
                    sourceEntityId: data.coverLetterDraftId,
                    fileName,
                    storagePath,
                    mimeType: rendered.mimeType,
                    checksumSha256: checksum(rendered.buffer),
                    byteSize: size(rendered.buffer),
                });

                return {
                    ...rendered,
                    fileName,
                };
            },

            renderApplicationPacket: async ({ format, data }) => {
                const profile = await resumeProfiles.getResumeProfileById(
                    data.resumeProfileId,
                );
                const version = await resumeVersions.getResumeVersionById(
                    data.resumeVersionId,
                );
                const draft = await coverLetters.getCoverLetterDraftById(
                    data.coverLetterDraftId,
                );

                if (!draft) {
                    throw new Error("COVER_LETTER_NOT_FOUND");
                }

                const resumeContent = {
                    name: profile?.name ?? "Resume",
                    headline: version?.normalizedResume?.headline,
                    summary: version?.normalizedResume?.summary,
                    experience: version?.normalizedResume?.experience ?? [],
                };

                const rendered =
                    format === "docx"
                        ? await renderApplicationPacketDocx({
                            coverLetter: {
                                content: draft.content,
                            },
                            resume: resumeContent,
                        })
                        : await renderApplicationPacketPdf({
                            coverLetter: {
                                content: draft.content,
                            },
                            resume: resumeContent,
                        });

                const fileName = `application-packet-${data.resumeProfileId}-${data.resumeVersionId}-${data.coverLetterDraftId}.${fileExtension(format)}`;
                const storagePath = `exports/resume-profiles/${data.resumeProfileId}/application-packets/${data.resumeVersionId}-${data.coverLetterDraftId}/${fileName}`;

                await artifacts.createExportedArtifact({
                    artifactType: "application-packet",
                    sourceEntityType: "resume_profile",
                    sourceEntityId: data.resumeProfileId,
                    fileName,
                    storagePath,
                    mimeType: rendered.mimeType,
                    checksumSha256: checksum(rendered.buffer),
                    byteSize: size(rendered.buffer),
                });

                return {
                    ...rendered,
                    fileName,
                };
            },
        },
    });

    return {
        exportDocument: createExport({
            exportResume: ({ format, resumeProfileId, resumeVersionId }) =>
                exportService.exportResume({
                    format,
                    resumeProfileId,
                    resumeVersionId: resumeVersionId!,
                }),
            exportCoverLetter: ({
                format,
                resumeProfileId,
                coverLetterDraftId,
            }) =>
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
        }),
    };
}