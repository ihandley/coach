import { beforeEach, describe, expect, it, vi } from "vitest";

const { createResumeProfileMock } = vi.hoisted(() => {
    return {
        createResumeProfileMock: vi.fn(),
    };
});

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<typeof import("@coach/db")>("@coach/db");

    return {
        ...actual,
        createDbCreateResumeProfile: () => createResumeProfileMock,
    };
});

describe("POST /api/resume-profiles", () => {
    beforeEach(() => {
        createResumeProfileMock.mockReset();
    });

    it("creates a resume profile", async () => {
        const normalizedResume = {
            basics: {
                fullName: "Ian Handley",
                headline: "Senior Software Engineer",
                summary: "Software engineer.",
            },
            skills: ["TypeScript"],
            experience: [],
            education: [],
        };

        const source = {
            kind: "manual",
            label: "Baseline Resume",
        };

        createResumeProfileMock.mockResolvedValue({
            profile: {
                id: "profile-123",
                name: "Primary Resume",
                currentVersionId: "version-123",
            },
            version: {
                id: "version-123",
                profileId: "profile-123",
                versionNumber: 1,
                kind: "baseline",
                source,
                normalizedResume,
            },
        });

        const { POST } = await import("./route");

        const request = new Request("http://localhost/api/resume-profiles", {
            method: "POST",
            body: JSON.stringify({
                name: "Primary Resume",
                source,
                normalizedResume,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(createResumeProfileMock).toHaveBeenCalledWith({
            name: "Primary Resume",
            source,
            normalizedResume,
        });
        expect(await response.json()).toEqual({
            profile: {
                id: "profile-123",
                name: "Primary Resume",
                currentVersionId: "version-123",
            },
            version: {
                id: "version-123",
                profileId: "profile-123",
                versionNumber: 1,
                kind: "baseline",
                source,
                normalizedResume,
            },
        });
    });

    it("returns 400 for invalid input", async () => {
        const { POST } = await import("./route");

        const request = new Request("http://localhost/api/resume-profiles", {
            method: "POST",
            body: JSON.stringify({
                name: 123,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const response = await POST(request);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: "INVALID_RESUME_PROFILE_INPUT",
        });
    });
});