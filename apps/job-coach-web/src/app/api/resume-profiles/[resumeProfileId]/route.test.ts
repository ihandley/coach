import { beforeEach, describe, expect, it, vi } from "vitest";

const getResumeProfile = vi.fn();

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<object>("@coach/db");

    return {
        ...actual,
        createDbGetResumeProfile: () => getResumeProfile,
    };
});

beforeEach(() => {
    getResumeProfile.mockReset();
    vi.resetModules();
});

describe("GET /api/resume-profiles/[resumeProfileId]", () => {
    it("returns a resume profile and its current version", async () => {
        getResumeProfile.mockResolvedValue({
            profile: {
                id: "profile-1",
                name: "Baseline Resume",
                currentVersionId: "version-2",
            },
            currentVersion: {
                id: "version-2",
                profileId: "profile-1",
                versionNumber: 2,
                source: {
                    kind: "manual",
                    label: "baseline-resume-v2",
                },
                normalizedResume: {
                    basics: {
                        fullName: "Ian Handley",
                        headline: "Senior Software Engineer",
                        summary: "Builds reliable product systems and leads delivery",
                    },
                    skills: ["TypeScript", "React", "Node.js"],
                    experience: [],
                    education: [],
                },
            },
        });

        const { GET } = await import("./route");

        const response = await GET(
            new Request("http://localhost/api/resume-profiles/profile-1"),
            {
                params: Promise.resolve({
                    resumeProfileId: "profile-1",
                }),
            },
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            profile: {
                id: "profile-1",
                name: "Baseline Resume",
                currentVersionId: "version-2",
            },
            currentVersion: {
                id: "version-2",
                versionNumber: 2,
            },
        });
    });

    it("returns 404 when the resume profile does not exist", async () => {
        getResumeProfile.mockRejectedValue(
            new Error("RESUME_PROFILE_NOT_FOUND"),
        );

        const { GET } = await import("./route");

        const response = await GET(
            new Request("http://localhost/api/resume-profiles/missing"),
            {
                params: Promise.resolve({
                    resumeProfileId: "missing",
                }),
            },
        );

        expect(response.status).toBe(404);
        await expect(response.json()).resolves.toMatchObject({
            error: "RESUME_PROFILE_NOT_FOUND",
        });
    });
});