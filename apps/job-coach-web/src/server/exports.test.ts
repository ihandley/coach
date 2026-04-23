import { describe, expect, it, vi } from "vitest";
import { createExportsServer } from "./exports";

describe("createExportsServer", () => {
    it("returns an export function", () => {
        const server = createExportsServer({
            resumeProfiles: {
                getResumeProfileById: vi.fn(),
            },
            resumeVersions: {
                getResumeVersionById: vi.fn(),
            },
            coverLetters: {
                getCoverLetterDraftById: vi.fn(),
            },
            artifacts: {
                createExportedArtifact: vi.fn(),
            },
        });

        expect(server.exportDocument).toBeTypeOf("function");
    });

    it("loads resume data for docx export and persists artifact metadata", async () => {
        const getResumeProfileById = vi.fn().mockResolvedValue({
            id: "rp1",
            name: "Jane Doe",
        });

        const getResumeVersionById = vi.fn().mockResolvedValue({
            id: "rv1",
            normalizedResume: {
                headline: "Software Engineer",
                summary: "Builds useful software.",
                experience: [
                    {
                        company: "Acme",
                        title: "Engineer",
                        bullets: ["Built systems", "Improved reliability"],
                    },
                ],
            },
        });

        const renderResumeDocx = vi.fn().mockResolvedValue({
            fileName: "resume.docx",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            buffer: new Uint8Array([1, 2, 3]).buffer,
        });

        const createExportedArtifact = vi.fn();

        const server = createExportsServer({
            resumeProfiles: {
                getResumeProfileById,
            },
            resumeVersions: {
                getResumeVersionById,
            },
            coverLetters: {
                getCoverLetterDraftById: vi.fn(),
            },
            artifacts: {
                createExportedArtifact,
            },
            renderResumeDocx,
        });

        const result = await server.exportDocument({
            documentType: "resume",
            format: "docx",
            resumeProfileId: "rp1",
            resumeVersionId: "rv1",
        });

        expect(getResumeProfileById).toHaveBeenCalledWith("rp1");
        expect(getResumeVersionById).toHaveBeenCalledWith("rv1");
        expect(renderResumeDocx).toHaveBeenCalledWith({
            resumeProfileId: "rp1",
            resumeVersionId: "rv1",
            content: {
                name: "Jane Doe",
                headline: "Software Engineer",
                summary: "Builds useful software.",
                experience: [
                    {
                        company: "Acme",
                        title: "Engineer",
                        bullets: ["Built systems", "Improved reliability"],
                    },
                ],
            },
        });

        expect(result.fileName).toBe("resume-rp1-rv1.docx");

        expect(createExportedArtifact).toHaveBeenCalledWith({
            artifactType: "resume",
            sourceEntityType: "resume_version",
            sourceEntityId: "rv1",
            fileName: "resume-rp1-rv1.docx",
            storagePath:
                "exports/resume-profiles/rp1/resume-versions/rv1/resume-rp1-rv1.docx",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            checksumSha256:
                "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81",
            byteSize: 3,
        });
    });

    it("loads resume data for pdf export and persists artifact metadata", async () => {
        const getResumeProfileById = vi.fn().mockResolvedValue({
            id: "rp1",
            name: "Jane Doe",
        });

        const getResumeVersionById = vi.fn().mockResolvedValue({
            id: "rv1",
            normalizedResume: {
                headline: "Software Engineer",
                summary: "Builds useful software.",
                experience: [
                    {
                        company: "Acme",
                        title: "Engineer",
                        bullets: ["Built systems", "Improved reliability"],
                    },
                ],
            },
        });

        const renderResumePdf = vi.fn().mockResolvedValue({
            fileName: "resume.pdf",
            mimeType: "application/pdf",
            buffer: new Uint8Array([4, 5, 6, 7]).buffer,
        });

        const createExportedArtifact = vi.fn();

        const server = createExportsServer({
            resumeProfiles: {
                getResumeProfileById,
            },
            resumeVersions: {
                getResumeVersionById,
            },
            coverLetters: {
                getCoverLetterDraftById: vi.fn(),
            },
            artifacts: {
                createExportedArtifact,
            },
            renderResumePdf,
        });

        const result = await server.exportDocument({
            documentType: "resume",
            format: "pdf",
            resumeProfileId: "rp1",
            resumeVersionId: "rv1",
        });

        expect(getResumeProfileById).toHaveBeenCalledWith("rp1");
        expect(getResumeVersionById).toHaveBeenCalledWith("rv1");
        expect(renderResumePdf).toHaveBeenCalledWith({
            resumeProfileId: "rp1",
            resumeVersionId: "rv1",
            content: {
                name: "Jane Doe",
                headline: "Software Engineer",
                summary: "Builds useful software.",
                experience: [
                    {
                        company: "Acme",
                        title: "Engineer",
                        bullets: ["Built systems", "Improved reliability"],
                    },
                ],
            },
        });

        expect(result.fileName).toBe("resume-rp1-rv1.pdf");

        expect(createExportedArtifact).toHaveBeenCalledWith({
            artifactType: "resume",
            sourceEntityType: "resume_version",
            sourceEntityId: "rv1",
            fileName: "resume-rp1-rv1.pdf",
            storagePath:
                "exports/resume-profiles/rp1/resume-versions/rv1/resume-rp1-rv1.pdf",
            mimeType: "application/pdf",
            checksumSha256:
                "c6d44cf418f610e3fe9e1d9294ff43def81c6cdcad6cbb1820cff48d3aa4355d",
            byteSize: 4,
        });
    });

    it("exports cover letter docx and persists artifact metadata", async () => {
        const createExportedArtifact = vi.fn();

        const server = createExportsServer({
            resumeProfiles: {
                getResumeProfileById: vi.fn(),
            },
            resumeVersions: {
                getResumeVersionById: vi.fn(),
            },
            coverLetters: {
                getCoverLetterDraftById: vi.fn().mockResolvedValue({
                    id: "cl1",
                    resumeProfileId: "rp1",
                    jobId: "job1",
                    content: "Hello world",
                    createdAt: new Date(),
                }),
            },
            artifacts: {
                createExportedArtifact,
            },
        });

        const result = await server.exportDocument({
            documentType: "cover-letter",
            format: "docx",
            resumeProfileId: "rp1",
            coverLetterDraftId: "cl1",
        });

        expect(result.fileName).toBe("cover-letter-rp1-cl1.docx");

        expect(createExportedArtifact).toHaveBeenCalledWith({
            artifactType: "cover-letter",
            sourceEntityType: "cover_letter_draft",
            sourceEntityId: "cl1",
            fileName: "cover-letter-rp1-cl1.docx",
            storagePath:
                "exports/resume-profiles/rp1/cover-letter-drafts/cl1/cover-letter-rp1-cl1.docx",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            checksumSha256: expect.any(String),
            byteSize: expect.any(Number),
        });
    });

    it("exports cover letter pdf and persists artifact metadata", async () => {
        const createExportedArtifact = vi.fn();

        const server = createExportsServer({
            resumeProfiles: {
                getResumeProfileById: vi.fn(),
            },
            resumeVersions: {
                getResumeVersionById: vi.fn(),
            },
            coverLetters: {
                getCoverLetterDraftById: vi.fn().mockResolvedValue({
                    id: "cl1",
                    resumeProfileId: "rp1",
                    jobId: "job1",
                    content: "Dear Hiring Manager,\n\nThanks for your time.",
                    createdAt: new Date(),
                }),
            },
            artifacts: {
                createExportedArtifact,
            },
        });

        const result = await server.exportDocument({
            documentType: "cover-letter",
            format: "pdf",
            resumeProfileId: "rp1",
            coverLetterDraftId: "cl1",
        });

        expect(result.fileName).toBe("cover-letter-rp1-cl1.pdf");
        expect(result.mimeType).toBe("application/pdf");
        expect(result.buffer.byteLength).toBeGreaterThan(100);

        expect(createExportedArtifact).toHaveBeenCalledWith({
            artifactType: "cover-letter",
            sourceEntityType: "cover_letter_draft",
            sourceEntityId: "cl1",
            fileName: "cover-letter-rp1-cl1.pdf",
            storagePath:
                "exports/resume-profiles/rp1/cover-letter-drafts/cl1/cover-letter-rp1-cl1.pdf",
            mimeType: "application/pdf",
            checksumSha256: expect.any(String),
            byteSize: expect.any(Number),
        });
    });

    it("exports application packet pdf and persists artifact metadata", async () => {
        const getResumeProfileById = vi.fn().mockResolvedValue({
            id: "rp1",
            name: "Jane Doe",
        });

        const getResumeVersionById = vi.fn().mockResolvedValue({
            id: "rv1",
            normalizedResume: {
                headline: "Software Engineer",
                summary: "Builds useful software.",
                experience: [
                    {
                        company: "Acme",
                        title: "Engineer",
                        bullets: ["Built systems", "Improved reliability"],
                    },
                ],
            },
        });

        const getCoverLetterDraftById = vi.fn().mockResolvedValue({
            id: "cl1",
            resumeProfileId: "rp1",
            jobId: "job1",
            content: "Dear Hiring Manager,\n\nThanks for your time.",
            createdAt: new Date(),
        });

        const createExportedArtifact = vi.fn();

        const server = createExportsServer({
            resumeProfiles: {
                getResumeProfileById,
            },
            resumeVersions: {
                getResumeVersionById,
            },
            coverLetters: {
                getCoverLetterDraftById,
            },
            artifacts: {
                createExportedArtifact,
            },
        });

        const result = await server.exportDocument({
            documentType: "application-packet",
            format: "pdf",
            resumeProfileId: "rp1",
            resumeVersionId: "rv1",
            coverLetterDraftId: "cl1",
        });

        expect(result.fileName).toBe("application-packet-rp1-rv1-cl1.pdf");
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