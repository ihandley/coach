import type { ExportRequest, ExportResult } from "./types";

type ExportHandler = (request: ExportRequest) => Promise<ExportResult>;

interface Dependencies {
    exportResume: ExportHandler;
    exportCoverLetter: ExportHandler;
    exportApplicationPacket: ExportHandler;
}

export function createExport(dependencies: Dependencies) {
    return async function execute(request: ExportRequest): Promise<ExportResult> {
        if (request.documentType === "resume") {
            if (!request.resumeVersionId) {
                throw new Error("RESUME_VERSION_ID_REQUIRED");
            }

            return dependencies.exportResume(request);
        }

        if (request.documentType === "cover-letter") {
            if (!request.coverLetterDraftId) {
                throw new Error("COVER_LETTER_DRAFT_ID_REQUIRED");
            }

            return dependencies.exportCoverLetter(request);
        }

        if (!request.resumeVersionId) {
            throw new Error("RESUME_VERSION_ID_REQUIRED");
        }

        if (!request.coverLetterDraftId) {
            throw new Error("COVER_LETTER_DRAFT_ID_REQUIRED");
        }

        return dependencies.exportApplicationPacket(request);
    };
}