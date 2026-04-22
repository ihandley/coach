import { describe, expect, it, vi } from "vitest";

const reviewCurrentResumeProfile = vi.fn();

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<object>("@coach/db");

    return {
        ...actual,
        createDbReviewCurrentResumeProfile: () => reviewCurrentResumeProfile,
    };
});

describe("GET /api/resume-profiles/[resumeProfileId]/review", () => {
    it("returns the current baseline review for a resume profile", async () => {
        reviewCurrentResumeProfile.mockResolvedValue({
            resumeProfileId: "profile-1",
            resumeVersionId: "version-1",
            review: {
                coreStrengths: ["Includes a clear professional headline."],
                missingSignals: [],
                concerns: [],
                targetRoleAlignment: ["Signals alignment to Software Engineer roles."],
                recommendedImprovements: [],
            },
        });

        const { GET } = await import("./route");

        const response = await GET(
            new Request("http://localhost/api/resume-profiles/profile-1/review"),
            {
                params: Promise.resolve({
                    resumeProfileId: "profile-1",
                }),
            },
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            resumeProfileId: "profile-1",
            resumeVersionId: "version-1",
            review: {
                coreStrengths: ["Includes a clear professional headline."],
            },
        });
    });
});