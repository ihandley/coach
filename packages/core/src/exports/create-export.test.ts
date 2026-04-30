import { describe, expect, it, vi } from "vitest";
import { createExport } from "./create-export";

describe("createExport", () => {
    it("delegates resume exports", async () => {
        const exportResume = vi.fn().mockResolvedValue({
            fileName: "resume.docx",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            buffer: new ArrayBuffer(0),
        });

        const exportCoverLetter = vi.fn();
        const exportApplicationPacket = vi.fn();

        const execute = createExport({
            exportResume,
            exportCoverLetter,
            exportApplicationPacket,
        });

        const result = await execute({
            documentType: "resume",
            format: "docx",
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
        });

        expect(exportResume).toHaveBeenCalledWith({
            documentType: "resume",
            format: "docx",
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
        });
        expect(exportCoverLetter).not.toHaveBeenCalled();
        expect(exportApplicationPacket).not.toHaveBeenCalled();
        expect(result.fileName).toBe("resume.docx");
    });

    it("delegates cover letter exports", async () => {
        const exportResume = vi.fn();
        const exportCoverLetter = vi.fn().mockResolvedValue({
            fileName: "cover-letter.pdf",
            mimeType: "application/pdf",
            buffer: new ArrayBuffer(0),
        });
        const exportApplicationPacket = vi.fn();

        const execute = createExport({
            exportResume,
            exportCoverLetter,
            exportApplicationPacket,
        });

        const result = await execute({
            documentType: "cover-letter",
            format: "pdf",
            resumeProfileId: "profile-1",
            coverLetterDraftId: "draft-1",
        });

        expect(exportCoverLetter).toHaveBeenCalledWith({
            documentType: "cover-letter",
            format: "pdf",
            resumeProfileId: "profile-1",
            coverLetterDraftId: "draft-1",
        });
        expect(exportResume).not.toHaveBeenCalled();
        expect(exportApplicationPacket).not.toHaveBeenCalled();
        expect(result.fileName).toBe("cover-letter.pdf");
    });

    it("delegates application packet exports", async () => {
        const exportResume = vi.fn();
        const exportCoverLetter = vi.fn();
        const exportApplicationPacket = vi.fn().mockResolvedValue({
            fileName: "application-packet.pdf",
            mimeType: "application/pdf",
            buffer: new ArrayBuffer(0),
        });

        const execute = createExport({
            exportResume,
            exportCoverLetter,
            exportApplicationPacket,
        });

        const result = await execute({
            documentType: "application-packet",
            format: "pdf",
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
            coverLetterDraftId: "draft-1",
        });

        expect(exportApplicationPacket).toHaveBeenCalledWith({
            documentType: "application-packet",
            format: "pdf",
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
            coverLetterDraftId: "draft-1",
        });
        expect(exportResume).not.toHaveBeenCalled();
        expect(exportCoverLetter).not.toHaveBeenCalled();
        expect(result.fileName).toBe("application-packet.pdf");
    });

    it("rejects resume exports without a resume version id", async () => {
        const execute = createExport({
            exportResume: vi.fn(),
            exportCoverLetter: vi.fn(),
            exportApplicationPacket: vi.fn(),
        });

        await expect(
            execute({
                documentType: "resume",
                format: "docx",
                resumeProfileId: "profile-1",
            }),
        ).rejects.toThrow("RESUME_VERSION_ID_REQUIRED");
    });

    it("rejects cover letter exports without a cover letter draft id", async () => {
        const execute = createExport({
            exportResume: vi.fn(),
            exportCoverLetter: vi.fn(),
            exportApplicationPacket: vi.fn(),
        });

        await expect(
            execute({
                documentType: "cover-letter",
                format: "pdf",
                resumeProfileId: "profile-1",
            }),
        ).rejects.toThrow("COVER_LETTER_DRAFT_ID_REQUIRED");
    });

    it("rejects application packet exports without both ids", async () => {
        const execute = createExport({
            exportResume: vi.fn(),
            exportCoverLetter: vi.fn(),
            exportApplicationPacket: vi.fn(),
        });

        await expect(
            execute({
                documentType: "application-packet",
                format: "pdf",
                resumeProfileId: "profile-1",
                resumeVersionId: "resume-version-1",
            }),
        ).rejects.toThrow("COVER_LETTER_DRAFT_ID_REQUIRED");
    });
});