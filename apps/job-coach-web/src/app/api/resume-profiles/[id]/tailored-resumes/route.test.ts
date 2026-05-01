import { describe, expect, it, vi } from "vitest";

const createTailoredResume = vi.fn();

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<object>("@coach/db");

    return {
        ...actual,
        createDbCreateTailoredResume: () => createTailoredResume,
    };
});

describe("POST /api/resume-profiles/[id]/tailored-resumes", () => {
    it("creates a tailored resume version", async () => {
        createTailoredResume.mockResolvedValue({
            version: {
                id: "version-2",
                profileId: "profile-1",
                versionNumber: 2,
                kind: "tailored",
                source: {
                    kind: "tailored",
                    label: "Tailored resume for job-123",
                },
                normalizedResume: {
                    basics: {
                        fullName: "Jane Doe",
                        headline: "Software Engineer",
                        summary: "Backend engineer with API and fintech integration experience.",
                    },
                    skills: ["TypeScript", "Node.js", "PostgreSQL"],
                    experience: [
                        {
                            company: "Acme",
                            title: "Software Engineer",
                            highlights: ["Built internal APIs"],
                        },
                    ],
                    education: [],
                },
                lineage: {
                    sourceResumeVersionId: "version-1",
                    sourceJobId: "job-123",
                },
            },
            suggestions: [
                {
                    id: "suggestion-1",
                    sectionTarget: "summary",
                    originalContent: "old",
                    suggestedContent: "new",
                    rationale: "reason",
                    relatedJobRequirements: ["payments"],
                    priority: "high",
                    confidence: "high",
                },
            ],
        });

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/resume-profiles/profile-1/tailored-resumes", {
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
        await expect(response.json()).resolves.toEqual(
            expect.objectContaining({
                version: expect.objectContaining({
                    id: "version-2",
                    profileId: "profile-1",
                    versionNumber: 2,
                    kind: "tailored",
                    lineage: {
                        sourceResumeVersionId: "version-1",
                        sourceJobId: "job-123",
                    },
                }),
                suggestions: expect.any(Array),
            }),
        );
    });

    it("returns 400 for invalid input", async () => {
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/resume-profiles/profile-1/tailored-resumes", {
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
            error: "INVALID_TAILORED_RESUME_INPUT",
        });
    });

    it("returns 404 when the resume profile does not exist", async () => {
        createTailoredResume.mockRejectedValue(new Error("RESUME_PROFILE_NOT_FOUND"));

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/resume-profiles/missing/tailored-resumes", {
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
        createTailoredResume.mockRejectedValue(new Error("RESUME_VERSION_NOT_FOUND"));

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/resume-profiles/profile-1/tailored-resumes", {
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
        createTailoredResume.mockRejectedValue(
            new Error("INVALID_TAILORING_SUGGESTIONS"),
        );

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/resume-profiles/profile-1/tailored-resumes", {
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