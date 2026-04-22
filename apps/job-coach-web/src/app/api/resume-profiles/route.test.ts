import { describe, expect, it, vi } from "vitest";

const createResumeProfile = vi.fn();

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<object>("@coach/db");

    return {
        ...actual,
        createDbCreateResumeProfile: () => createResumeProfile,
    };
});

describe("POST /api/resume-profiles", () => {
    it("creates a baseline resume profile and initial version", async () => {
        createResumeProfile.mockResolvedValue({
            profile: {
                id: "profile-1",
                name: "Baseline Resume",
                currentVersionId: "version-1",
            },
            version: {
                id: "version-1",
                profileId: "profile-1",
                versionNumber: 1,
                source: {
                    kind: "manual",
                    label: "baseline-resume",
                },
                normalizedResume: {
                    basics: {
                        fullName: "Ian Handley",
                        headline: "Software Engineer",
                        summary: "Builds reliable product systems",
                    },
                    skills: ["TypeScript", "React"],
                    experience: [],
                    education: [],
                },
            },
        });

        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/resume-profiles", {
                method: "POST",
                body: JSON.stringify({
                    name: "Baseline Resume",
                    source: {
                        kind: "manual",
                        label: "baseline-resume",
                    },
                    normalizedResume: {
                        basics: {
                            fullName: "Ian Handley",
                            headline: "Software Engineer",
                            summary: "Builds reliable product systems",
                        },
                        skills: ["TypeScript", "React"],
                        experience: [],
                        education: [],
                    },
                }),
                headers: {
                    "content-type": "application/json",
                },
            }),
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            profile: {
                id: "profile-1",
                name: "Baseline Resume",
            },
            version: {
                id: "version-1",
                versionNumber: 1,
            },
        });
    });
});