import { beforeEach, describe, expect, it, vi } from "vitest";

const exportDocumentMock = vi.fn();

vi.mock("../../../server/exports", () => {
    return {
        createExportsServer: () => ({
            exportDocument: exportDocumentMock,
        }),
    };
});

describe("POST /api/exports", () => {
    beforeEach(() => {
        exportDocumentMock.mockReset();
    });

    it("returns exported resume content", async () => {
        exportDocumentMock.mockResolvedValue({
            fileName: "resume.docx",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            buffer: new Uint8Array([1, 2, 3]).buffer,
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

        const bytes = await response.arrayBuffer();
        expect(bytes.byteLength).toBeGreaterThan(0);

        expect(exportDocumentMock).toHaveBeenCalledWith({
            documentType: "resume",
            format: "docx",
            resumeProfileId: "profile-1",
            resumeVersionId: "resume-version-1",
        });
    });

    it("returns exported resume pdf content", async () => {
        exportDocumentMock.mockResolvedValue({
            fileName: "resume.pdf",
            mimeType: "application/pdf",
            buffer: new Uint8Array([1, 2, 3]).buffer,
        });

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/exports", {
                method: "POST",
                body: JSON.stringify({
                    documentType: "resume",
                    format: "pdf",
                    resumeProfileId: "profile-1",
                    resumeVersionId: "resume-version-1",
                }),
            }),
        );

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain("application/pdf");
        expect(response.headers.get("content-disposition")).toBe(
            'attachment; filename="resume.pdf"',
        );

        const bytes = await response.arrayBuffer();
        expect(bytes.byteLength).toBeGreaterThan(0);

        expect(exportDocumentMock).toHaveBeenCalledWith({
            documentType: "resume",
            format: "pdf",
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
        expect(exportDocumentMock).not.toHaveBeenCalled();
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
        expect(exportDocumentMock).not.toHaveBeenCalled();
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
        expect(exportDocumentMock).not.toHaveBeenCalled();
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
        expect(exportDocumentMock).not.toHaveBeenCalled();
    });
});