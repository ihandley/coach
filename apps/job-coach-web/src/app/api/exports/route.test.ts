import { describe, expect, it, vi, beforeEach } from "vitest";

const createExportMock = vi.fn();

vi.mock("@coach/core", async () => {
    const actual = await vi.importActual<typeof import("@coach/core")>("@coach/core");

    return {
        ...actual,
        createExport: () => createExportMock,
    };
});

describe("POST /api/exports", () => {
    beforeEach(() => {
        createExportMock.mockReset();
    });

    it("returns exported resume content", async () => {
        createExportMock.mockResolvedValue({
            fileName: "resume.docx",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            buffer: new ArrayBuffer(3),
        });

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/exports", {
                method: "POST",
                body: JSON.stringify({
                    documentType: "resume",
                    format: "docx",
                    resumeProfileId: "profile-1",
                    resumeVersionId: "resume-version-1",
                }),
            }),
        );

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );
        expect(response.headers.get("content-disposition")).toBe(
            'attachment; filename="resume.docx"',
        );
        expect(createExportMock).toHaveBeenCalledWith({
            documentType: "resume",
            format: "docx",
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
        });
    });

    it("returns 400 for invalid input", async () => {
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/exports", {
                method: "POST",
                body: JSON.stringify({
                    documentType: "",
                    format: "docx",
                }),
            }),
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "INVALID_EXPORT_INPUT",
        });
        expect(createExportMock).not.toHaveBeenCalled();
    });

    it("returns 400 when resume export is missing resumeVersionId", async () => {
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/exports", {
                method: "POST",
                body: JSON.stringify({
                    documentType: "resume",
                    format: "docx",
                    resumeProfileId: "profile-1",
                }),
            }),
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "INVALID_EXPORT_INPUT",
        });
        expect(createExportMock).not.toHaveBeenCalled();
    });

    it("returns 400 when cover letter export is missing coverLetterDraftId", async () => {
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/exports", {
                method: "POST",
                body: JSON.stringify({
                    documentType: "cover-letter",
                    format: "pdf",
                    resumeProfileId: "profile-1",
                }),
            }),
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "INVALID_EXPORT_INPUT",
        });
        expect(createExportMock).not.toHaveBeenCalled();
    });

    it("returns 400 when application packet export is missing ids", async () => {
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/exports", {
                method: "POST",
                body: JSON.stringify({
                    documentType: "application-packet",
                    format: "pdf",
                    resumeProfileId: "profile-1",
                    resumeVersionId: "resume-version-1",
                }),
            }),
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "INVALID_EXPORT_INPUT",
        });
        expect(createExportMock).not.toHaveBeenCalled();
    });
});