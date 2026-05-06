import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { extractPdfTextMock, normalizeResumeWithAiMock } = vi.hoisted(() => ({
  extractPdfTextMock: vi.fn(),
  normalizeResumeWithAiMock: vi.fn(),
}));

vi.mock("@/lib/resume/pdf-parser", () => ({
  extractPdfText: extractPdfTextMock,
}));

vi.mock("@/lib/resume/ai-normalizer", () => ({
  normalizeResumeWithAi: normalizeResumeWithAiMock,
}));

import { POST } from "./route";

function createImportRequest(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  return {
    url: "http://localhost/api/resume-profiles/import",
    formData: async () => formData,
  } as Request;
}

describe("POST /api/resume-profiles/import", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    extractPdfTextMock.mockReset();
    normalizeResumeWithAiMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns a structured error for invalid file types without creating records", async () => {
    const response = await POST(
      createImportRequest(new File(["plain text"], "resume.txt", { type: "text/plain" })),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Please upload a PDF resume." });
    expect(extractPdfTextMock).not.toHaveBeenCalled();
    expect(normalizeResumeWithAiMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a structured error for malformed PDFs without creating records", async () => {
    extractPdfTextMock.mockRejectedValueOnce(new Error("bad pdf"));

    const response = await POST(
      createImportRequest(new File(["not a pdf"], "resume.pdf", { type: "application/pdf" })),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "We could not read that PDF. Please upload a valid PDF resume.",
    });
    expect(normalizeResumeWithAiMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a structured error for empty extraction without creating records", async () => {
    extractPdfTextMock.mockResolvedValueOnce("   ");

    const response = await POST(
      createImportRequest(new File(["%PDF-1.4"], "resume.pdf", { type: "application/pdf" })),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "We could not find any resume text in that PDF.",
    });
    expect(normalizeResumeWithAiMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a structured error for AI normalization failure without creating records", async () => {
    extractPdfTextMock.mockResolvedValueOnce("Ian Handley\nSUMMARY\nSoftware engineer");
    normalizeResumeWithAiMock.mockRejectedValueOnce(new Error("model unavailable"));

    const response = await POST(
      createImportRequest(new File(["%PDF-1.4"], "resume.pdf", { type: "application/pdf" })),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "AI resume normalization failed",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
