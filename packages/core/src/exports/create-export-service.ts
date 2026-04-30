import type { ExportFormat, ExportResult } from "./types";
import type { ExportRenderers } from "./renderers";

export function createExportService({
    renderers,
}: {
    renderers: ExportRenderers;
}) {
    return {
        async exportResume(input: {
            format: ExportFormat;
            resumeProfileId: string;
            resumeVersionId: string;
        }): Promise<ExportResult> {
            return renderers.renderResume({
                format: input.format,
                data: {
                    resumeProfileId: input.resumeProfileId,
                    resumeVersionId: input.resumeVersionId,
                },
            });
        },

        async exportCoverLetter(input: {
            format: ExportFormat;
            resumeProfileId: string;
            coverLetterDraftId: string;
        }): Promise<ExportResult> {
            return renderers.renderCoverLetter({
                format: input.format,
                data: {
                    resumeProfileId: input.resumeProfileId,
                    coverLetterDraftId: input.coverLetterDraftId,
                },
            });
        },

        async exportApplicationPacket(input: {
            format: ExportFormat;
            resumeProfileId: string;
            resumeVersionId: string;
            coverLetterDraftId: string;
        }): Promise<ExportResult> {
            return renderers.renderApplicationPacket({
                format: input.format,
                data: {
                    resumeProfileId: input.resumeProfileId,
                    resumeVersionId: input.resumeVersionId,
                    coverLetterDraftId: input.coverLetterDraftId,
                },
            });
        },
    };
}