import { describe, expect, it, vi } from "vitest";

const generateTailoringSuggestions = vi.fn();

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<object>("@coach/db");

  return {
    ...actual,
    createDbGenerateTailoringSuggestions: () => generateTailoringSuggestions,
  };
});

describe("POST /api/resume-profiles/[id]/tailoring-suggestions", () => {
  it("returns structured tailoring suggestions", async () => {
    generateTailoringSuggestions.mockResolvedValue([
      {
        id: "suggestion-1",
        sectionTarget: "summary",
        originalContent: "Backend engineer with API and platform experience.",
        suggestedContent:
          "Backend engineer with API, platform, and fintech integration experience.",
        rationale: "Align summary with the target job domain.",
        relatedJobRequirements: ["payments", "backend systems"],
        priority: "high",
        confidence: "high",
      },
    ]);

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/profile-1/tailoring-suggestions", {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          sourceResumeVersionId: "version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "profile-1",
        }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: "suggestion-1",
        sectionTarget: "summary",
        priority: "high",
        confidence: "high",
      }),
    ]);
  });

  it("returns 400 for invalid input", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/profile-1/tailoring-suggestions", {
        method: "POST",
        body: JSON.stringify({
          jobId: "",
          sourceResumeVersionId: "version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "profile-1",
        }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_TAILORING_SUGGESTIONS_INPUT",
    });
  });

  it("returns 404 when the resume profile does not exist", async () => {
    generateTailoringSuggestions.mockRejectedValue(new Error("RESUME_PROFILE_NOT_FOUND"));

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/missing/tailoring-suggestions", {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          sourceResumeVersionId: "version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "missing",
        }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "RESUME_PROFILE_NOT_FOUND",
    });
  });

  it("returns 404 when the resume version does not exist", async () => {
    generateTailoringSuggestions.mockRejectedValue(new Error("RESUME_VERSION_NOT_FOUND"));

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/profile-1/tailoring-suggestions", {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          sourceResumeVersionId: "missing-version",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "profile-1",
        }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "RESUME_VERSION_NOT_FOUND",
    });
  });

  it("returns 400 when generated suggestions are malformed", async () => {
    generateTailoringSuggestions.mockRejectedValue(new Error("INVALID_TAILORING_SUGGESTIONS"));

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/profile-1/tailoring-suggestions", {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          sourceResumeVersionId: "version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "profile-1",
        }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_TAILORING_SUGGESTIONS",
    });
  });
});
