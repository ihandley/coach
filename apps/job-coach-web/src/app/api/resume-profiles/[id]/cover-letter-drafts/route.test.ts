import { describe, expect, it, vi, beforeEach } from "vitest";

const { createCoverLetterDraftMock } = vi.hoisted(() => {
  return {
    createCoverLetterDraftMock: vi.fn(),
  };
});

vi.mock("@coach/core", async () => {
  const actual = await vi.importActual<typeof import("@coach/core")>("@coach/core");

  return {
    ...actual,
    createCoverLetterDraft: createCoverLetterDraftMock,
  };
});

describe("POST /api/resume-profiles/[id]/cover-letter-drafts", () => {
  beforeEach(() => {
    createCoverLetterDraftMock.mockReset();
  });

  it("creates a cover letter draft", async () => {
    createCoverLetterDraftMock.mockResolvedValue({
      id: "cover-letter-draft-123",
      resumeProfileId: "resume-profile-123",
      jobId: "job-123",
      content: "Draft content",
      createdAt: new Date("2026-04-22T12:00:00.000Z"),
    });

    const { POST } = await import("./route");

    const request = new Request(
      "http://localhost/api/resume-profiles/resume-profile-123/cover-letter-drafts",
      {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          candidateName: "Ian Handley",
          companyName: "Acme",
          jobTitle: "Senior Software Engineer",
          jobSummary: "Build product features.",
          resumeSummary: "Built web apps and APIs.",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        id: "resume-profile-123",
      }),
    });

    expect(response.status).toBe(201);
  });

  it("returns 400 for invalid input", async () => {
    const { POST } = await import("./route");

    const request = new Request(
      "http://localhost/api/resume-profiles/resume-profile-123/cover-letter-drafts",
      {
        method: "POST",
        body: JSON.stringify({
          jobId: 123,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        id: "resume-profile-123",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 for malformed json", async () => {
    const { POST } = await import("./route");

    const request = new Request(
      "http://localhost/api/resume-profiles/resume-profile-123/cover-letter-drafts",
      {
        method: "POST",
        body: "{not-valid-json",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        id: "resume-profile-123",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid request body",
    });
  });
});
