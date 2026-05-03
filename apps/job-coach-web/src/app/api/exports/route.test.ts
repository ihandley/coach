import { afterEach, describe, expect, it, vi } from "vitest";

const exportDocumentMock = vi.fn();

vi.mock("../../../server/exports", () => {
  return {
    createExportsServer: () => ({
      exportDocument: exportDocumentMock,
    }),
  };
});

describe("POST /api/exports", () => {
  afterEach(() => {
    exportDocumentMock.mockReset();
  });

  it("returns exported resume content", async () => {
    const { POST } = await import("./route");

    exportDocumentMock.mockResolvedValue({
      fileName: "resume.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: new TextEncoder().encode("resume").buffer,
    });

    const response = await POST(
      new Request("http://localhost/api/exports", {
        method: "POST",
        body: JSON.stringify({
          documentType: "resume",
          format: "docx",
          resumeProfileId: "resume-profile-1",
          resumeVersionId: "resume-version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="resume.docx"');

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(bytes)).toBe("resume");

    expect(exportDocumentMock).toHaveBeenCalledWith({
      documentType: "resume",
      format: "docx",
      resumeProfileId: "resume-profile-1",
      resumeVersionId: "resume-version-1",
    });
  });

  it("returns exported resume pdf content", async () => {
    const { POST } = await import("./route");

    exportDocumentMock.mockResolvedValue({
      fileName: "resume.pdf",
      mimeType: "application/pdf",
      buffer: new TextEncoder().encode("%PDF").buffer,
    });

    const response = await POST(
      new Request("http://localhost/api/exports", {
        method: "POST",
        body: JSON.stringify({
          documentType: "resume",
          format: "pdf",
          resumeProfileId: "resume-profile-1",
          resumeVersionId: "resume-version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/pdf");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="resume.pdf"');

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(bytes)).toBe("%PDF");

    expect(exportDocumentMock).toHaveBeenCalledWith({
      documentType: "resume",
      format: "pdf",
      resumeProfileId: "resume-profile-1",
      resumeVersionId: "resume-version-1",
    });
  });

  it("returns exported application packet pdf content", async () => {
    const { POST } = await import("./route");

    exportDocumentMock.mockResolvedValue({
      fileName: "application-packet-rp1-rv1-cl1.pdf",
      mimeType: "application/pdf",
      buffer: new TextEncoder().encode("%PDF-application-packet").buffer,
    });

    const response = await POST(
      new Request("http://localhost/api/exports", {
        method: "POST",
        body: JSON.stringify({
          documentType: "application-packet",
          format: "pdf",
          resumeProfileId: "rp1",
          resumeVersionId: "rv1",
          coverLetterDraftId: "cl1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="application-packet-rp1-rv1-cl1.pdf"',
    );

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(bytes)).toBe("%PDF-application-packet");

    expect(exportDocumentMock).toHaveBeenCalledWith({
      documentType: "application-packet",
      format: "pdf",
      resumeProfileId: "rp1",
      resumeVersionId: "rv1",
      coverLetterDraftId: "cl1",
    });
  });

  it("returns 400 for invalid document type", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/exports", {
        method: "POST",
        body: JSON.stringify({
          documentType: "invalid",
          format: "docx",
          resumeProfileId: "resume-profile-1",
          resumeVersionId: "resume-version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(400);
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
          resumeProfileId: "resume-profile-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(400);
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
          resumeProfileId: "resume-profile-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(400);
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
          resumeProfileId: "resume-profile-1",
          resumeVersionId: "resume-version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(exportDocumentMock).not.toHaveBeenCalled();
  });

  it.each(["RESUME_PROFILE_NOT_FOUND", "RESUME_VERSION_NOT_FOUND"])(
    "returns 404 when export fails with %s",
    async (errorCode) => {
      const { POST } = await import("./route");

      exportDocumentMock.mockRejectedValue(new Error(errorCode));

      const response = await POST(
        new Request("http://localhost/api/exports", {
          method: "POST",
          body: JSON.stringify({
            documentType: "resume",
            format: "pdf",
            resumeProfileId: "resume-profile-1",
            resumeVersionId: "resume-version-1",
          }),
          headers: {
            "content-type": "application/json",
          },
        }),
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: errorCode });
    },
  );
});
