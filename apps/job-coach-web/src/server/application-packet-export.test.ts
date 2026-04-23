import { describe, expect, it, vi } from "vitest";
import { createExportsServer } from "./exports";

describe("application packet export", () => {
    it("exports application packet pdf and persists artifact", async () => {
        const getResumeProfileById = vi.fn().mockResolvedValue({
            id: "rp1",
            name: "Test User",
        });

        const getResumeVersionById = vi.fn().mockResolvedValue({
            id: "rv1",
            normalizedResume: {
                headline: "Engineer",
                summary: "Summary",
                experience: [],
            },
        });

        const getCoverLetterDraftById = vi.fn().mockResolvedValue({
            id: "cl1",
            resumeProfileId: "rp1",
            jobId: "job1",
            content: "Cover letter body",
            createdAt: new Date(),
        });

        const createExportedArtifact = vi.fn();

        const server = createExportsServer({
            resumeProfiles: { getResumeProfileById },
            resumeVersions: { getResumeVersionById },
            coverLetters: { getCoverLetterDraftById },
            artifacts: { createExportedArtifact },
        });

        const result = await server.exportDocument({
            documentType: "application-packet",
            format: "pdf",
            resumeProfileId: "rp1",
            resumeVersionId: "rv1",
            coverLetterDraftId: "cl1",
        });

        expect(result.fileName).toBe(
            "application-packet-rp1-rv1-cl1.pdf",
        );
        expect(result.mimeType).toBe("application/pdf");
        expect(result.buffer.byteLength).toBeGreaterThan(100);

        expect(getResumeProfileById).toHaveBeenCalledWith("rp1");
        expect(getResumeVersionById).toHaveBeenCalledWith("rv1");
        expect(getCoverLetterDraftById).toHaveBeenCalledWith("cl1");

        expect(createExportedArtifact).toHaveBeenCalledWith({
            artifactType: "application-packet",
            sourceEntityType: "resume_profile",
            sourceEntityId: "rp1",
            fileName: "application-packet-rp1-rv1-cl1.pdf",
            storagePath:
                "exports/resume-profiles/rp1/application-packets/rv1-cl1/application-packet-rp1-rv1-cl1.pdf",
            mimeType: "application/pdf",
            checksumSha256: expect.any(String),
            byteSize: expect.any(Number),
        });
    });
});