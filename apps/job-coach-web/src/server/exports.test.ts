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
        });

        expect(server.exportDocument).toBeTypeOf("function");
    });

    it("loads resume data for docx export", async () => {
        const getResumeProfileById = vi.fn().mockResolvedValue({
            id: "profile-1",
            name: "Jane Doe",
        });

        const getResumeVersionById = vi.fn().mockResolvedValue({
            id: "resume-version-1",
            normalizedResume: {
                headline: "Senior Software Engineer",
                summary: "Builds reliable product systems.",
                experience: [
                    {
                        company: "Acme",
                        title: "Engineer",
                        bullets: ["Built APIs", "Improved reliability"],
                    },
                ],
            },
        });

        const renderResumeDocx = vi.fn().mockResolvedValue({
            fileName: "resume.docx",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            buffer: new ArrayBuffer(1),
        });

        const server = createExportsServer({
            resumeProfiles: { getResumeProfileById },
            resumeVersions: { getResumeVersionById },
            renderResumeDocx,
        });

        await server.exportDocument({
            documentType: "resume",
            format: "docx",
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
        });

        expect(getResumeProfileById).toHaveBeenCalledWith("profile-1");
        expect(getResumeVersionById).toHaveBeenCalledWith("resume-version-1");
        expect(renderResumeDocx).toHaveBeenCalled();
    });

    it("loads resume data for pdf export", async () => {
        const getResumeProfileById = vi.fn().mockResolvedValue({
            id: "profile-1",
            name: "Jane Doe",
        });

        const getResumeVersionById = vi.fn().mockResolvedValue({
            id: "resume-version-1",
            normalizedResume: {
                headline: "Senior Software Engineer",
                summary: "Builds reliable product systems.",
                experience: [
                    {
                        company: "Acme",
                        title: "Engineer",
                        bullets: ["Built APIs", "Improved reliability"],
                    },
                ],
            },
        });

        const renderResumePdf = vi.fn().mockResolvedValue({
            fileName: "resume.pdf",
            mimeType: "application/pdf",
            buffer: new ArrayBuffer(1),
        });

        const server = createExportsServer({
            resumeProfiles: { getResumeProfileById },
            resumeVersions: { getResumeVersionById },
            renderResumePdf,
        });

        await server.exportDocument({
            documentType: "resume",
            format: "pdf",
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
        });

        expect(getResumeProfileById).toHaveBeenCalledWith("profile-1");
        expect(getResumeVersionById).toHaveBeenCalledWith("resume-version-1");
        expect(renderResumePdf).toHaveBeenCalled();
    });
});