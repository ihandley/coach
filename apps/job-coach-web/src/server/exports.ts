import { createHash } from "node:crypto";
import { createExport, createExportService, type ExportFormat } from "@coach/core";
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

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : {};
}

function getString(value: unknown) {
    return typeof value === "string" && value.trim().length > 0
        ? value
        : undefined;
}

function getStringArray(value: unknown) {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
}

function createResumeExportContent(profile: any, version: any) {
    const normalizedResume = asRecord(version?.normalizedResume);
    const basics = asRecord(normalizedResume.basics);
    const versionSource = asRecord(version?.source);
    const experience = Array.isArray(normalizedResume.experience)
        ? normalizedResume.experience
            .map((item) => {
                const record = asRecord(item);
                const bullets = [
                    ...getStringArray(record.bullets),
                    ...getStringArray(record.highlights),
                ];

                return {
                    company: getString(record.company) ?? "",
                    title: getString(record.title) ?? "",
                    bullets,
                };
            })
            .filter(
                (item) =>
                    item.company.length > 0 ||
                    item.title.length > 0 ||
                    item.bullets.length > 0,
            )
        : [];

    return {
        name: getString(versionSource.label) ?? profile?.name ?? "Resume",
        headline: getString(normalizedResume.headline) ?? getString(basics.headline),
        summary: getString(normalizedResume.summary) ?? getString(basics.summary),
        experience,
    };
}

function createSupabaseResumeProfileRepository(db: any) {
    return {
        async getResumeProfileById(resumeProfileId: string) {
            const { data, error } = await db
                .from("resume_profiles")
                .select("id,name,current_version_id")
                .eq("id", resumeProfileId)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return data
                ? {
                    id: data.id,
                    name: data.name,
                    currentVersionId: data.current_version_id ?? "",
                }
                : null;
        },
    };
}

function createSupabaseResumeVersionRepository(db: any) {
    return {
        async getResumeVersionById(resumeVersionId: string) {
            const { data, error } = await db
                .from("resume_versions")
                .select(
                    "id,resume_profile_id,version_number,kind,source_kind,source_label,normalized_resume",
                )
                .eq("id", resumeVersionId)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return data
                ? {
                    id: data.id,
                    profileId: data.resume_profile_id,
                    versionNumber: data.version_number,
                    kind: data.kind,
                    source: {
                        kind: data.source_kind,
                        label: data.source_label,
                    },
                    normalizedResume: data.normalized_resume,
                }
                : null;
        },
    };
}

function createSupabaseCoverLetterRepository(db: any) {
    return {
        async getCoverLetterDraftById(id: string) {
            const { data, error } = await db
                .from("cover_letter_drafts")
                .select("id,resume_profile_id,job_id,content,created_at")
                .eq("id", id)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return data
                ? {
                    id: data.id,
                    resumeProfileId: data.resume_profile_id,
                    jobId: data.job_id,
                    content: data.content,
                    createdAt: new Date(data.created_at),
                }
                : null;
        },
    };
}

function createSupabaseExportedArtifactRepository(db: any) {
    return {
        async createExportedArtifact(input: {
            artifactType: string;
            sourceEntityType: string;
            sourceEntityId: string;
            fileName: string;
            storagePath: string;
            mimeType: string;
            checksumSha256: string;
            byteSize: number;
        }) {
            const { data, error } = await db
                .from("exported_artifacts")
                .insert({
                    artifact_type: input.artifactType,
                    source_entity_type: input.sourceEntityType,
                    source_entity_id: input.sourceEntityId,
                    file_name: input.fileName,
                    storage_path: input.storagePath,
                    mime_type: input.mimeType,
                    checksum_sha256: input.checksumSha256,
                    byte_size: input.byteSize,
                })
                .select("*")
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
    };
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
        createSupabaseResumeProfileRepository(db!);

    const resumeVersions =
        dependencies?.resumeVersions ??
        createSupabaseResumeVersionRepository(db!);

    const coverLetters =
        dependencies?.coverLetters ??
        createSupabaseCoverLetterRepository(db!);

    const artifacts =
        dependencies?.artifacts ??
        createSupabaseExportedArtifactRepository(db!);

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

                const content = createResumeExportContent(profile, version);

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

                const resumeContent = createResumeExportContent(profile, version);

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
