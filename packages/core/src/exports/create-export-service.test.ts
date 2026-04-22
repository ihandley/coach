import { describe, expect, it, vi } from "vitest";
import { createExportService } from "./create-export-service";

describe("createExportService", () => {
    it("renders a resume export", async () => {
        const renderResume = vi.fn().mockResolvedValue({
            fileName: "resume.docx",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            buffer: new ArrayBuffer(0),
        });

        const service = createExportService({
            renderers: {
                renderResume,
                renderCoverLetter: vi.fn(),
                renderApplicationPacket: vi.fn(),
            },
        });

        const result = await service.exportResume({
            format: "docx",
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
        });

        expect(renderResume).toHaveBeenCalledWith({
            format: "docx",
            data: {
                resumeProfileId: "profile-1",
                resumeVersionId: "resume-version-1",
            },
        });
        expect(result.fileName).toBe("resume.docx");
    });

    it("renders a cover letter export", async () => {
        const renderCoverLetter = vi.fn().mockResolvedValue({
            fileName: "cover-letter.pdf",
            mimeType: "application/pdf",
            buffer: new ArrayBuffer(0),
        });

        const service = createExportService({
            renderers: {
                renderResume: vi.fn(),
                renderCoverLetter,
                renderApplicationPacket: vi.fn(),
            },
        });

        const result = await service.exportCoverLetter({
            format: "pdf",
            resumeProfileId: "profile-1",
            coverLetterDraftId: "draft-1",
        });

        expect(renderCoverLetter).toHaveBeenCalledWith({
            format: "pdf",
            data: {
                resumeProfileId: "profile-1",
                coverLetterDraftId: "draft-1",
            },
        });
        expect(result.fileName).toBe("cover-letter.pdf");
    });

    it("renders an application packet export", async () => {
        const renderApplicationPacket = vi.fn().mockResolvedValue({
            fileName: "application-packet.pdf",
            mimeType: "application/pdf",
            buffer: new ArrayBuffer(0),
        });

        const service = createExportService({
            renderers: {
                renderResume: vi.fn(),
                renderCoverLetter: vi.fn(),
                renderApplicationPacket,
            },
        });

        const result = await service.exportApplicationPacket({
            format: "pdf",
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
            coverLetterDraftId: "draft-1",
        });

        expect(renderApplicationPacket).toHaveBeenCalledWith({
            format: "pdf",
            data: {
                resumeProfileId: "profile-1",
                resumeVersionId: "resume-version-1",
                coverLetterDraftId: "draft-1",
            },
        });
        expect(result.fileName).toBe("application-packet.pdf");
    });
});