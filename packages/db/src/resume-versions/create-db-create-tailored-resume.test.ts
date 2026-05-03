import { describe, expect, it } from "vitest";

import { createDbCreateTailoredResume } from "./create-db-create-tailored-resume";

const normalizedResume = {
    basics: {
        fullName: "Jane Doe",
        headline: "Software Engineer",
        summary: "Backend engineer with API and platform experience.",
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
};

describe("createDbCreateTailoredResume", () => {
    it("creates a separate tailored profile and leaves the source profile unchanged", async () => {
        const profiles = new Map([
            [
                "profile-1",
                {
                    id: "profile-1",
                    name: "Jane Doe Resume",
                    currentVersionId: "version-1",
                },
            ],
        ]);
        const createdProfiles: unknown[] = [];
        const updatedProfiles: unknown[] = [];
        const createdVersions: unknown[] = [];

        const createTailoredResume = createDbCreateTailoredResume({
            jobs: {
                getJobById: async (jobId: string) =>
                    jobId === "job-123"
                        ? {
                            id: "job-123",
                            company: "Pattern",
                        }
                        : null,
            },
            resumeProfiles: {
                getResumeProfileById: async (resumeProfileId: string) =>
                    profiles.get(resumeProfileId) ?? null,
                createResumeProfile: async (input) => {
                    createdProfiles.push(input);

                    const profile = {
                        id: "profile-2",
                        name: input.name,
                        currentVersionId: "",
                    };

                    profiles.set(profile.id, profile);
                    return profile;
                },
                updateResumeProfileCurrentVersion: async ({
                    resumeProfileId,
                    currentVersionId,
                }) => {
                    updatedProfiles.push({ resumeProfileId, currentVersionId });

                    const profile = profiles.get(resumeProfileId);

                    if (!profile) {
                        return null;
                    }

                    const updated = {
                        ...profile,
                        currentVersionId,
                    };

                    profiles.set(resumeProfileId, updated);
                    return updated;
                },
            },
            resumeVersions: {
                getResumeVersionById: async (resumeVersionId: string) =>
                    resumeVersionId === "version-1"
                        ? {
                            id: "version-1",
                            profileId: "profile-1",
                            versionNumber: 1,
                            normalizedResume,
                        }
                        : null,
                createResumeVersion: async (input) => {
                    createdVersions.push(input);

                    return {
                        id: "version-2",
                        kind: input.kind,
                    };
                },
            },
            generateTailoringSuggestions: async () => [
                {
                    id: "suggestion-1",
                    sectionTarget: "summary",
                    originalContent: "Backend engineer with API and platform experience.",
                    suggestedContent:
                        "Backend engineer with API, platform, and fintech integration experience.",
                    rationale: "Align summary with the target job domain.",
                    relatedJobRequirements: ["payments", "backend systems"],
                    priority: "high" as const,
                    confidence: "high" as const,
                },
            ],
        });

        const result = await createTailoredResume({
            profileId: "profile-1",
            jobId: "job-123",
            sourceResumeVersionId: "version-1",
        });

        expect(profiles.get("profile-1")).toEqual({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });
        expect(createdProfiles).toEqual([
            {
                name: "Jane Doe Resume - Pattern",
                source: {
                    kind: "tailored",
                    label: "Jane Doe Resume - Pattern",
                },
                normalizedResume,
            },
        ]);
        expect(createdVersions).toEqual([
            {
                profileId: "profile-2",
                versionNumber: 1,
                kind: "tailored",
                source: {
                    kind: "tailored",
                    label: "Jane Doe Resume - Pattern",
                },
                normalizedResume,
                lineage: {
                    sourceResumeVersionId: "version-1",
                    sourceJobId: "job-123",
                },
            },
        ]);
        expect(updatedProfiles).toEqual([
            {
                resumeProfileId: "profile-2",
                currentVersionId: "version-2",
            },
        ]);
        expect(result.version.id).toBe("version-2");
        expect(result.version.profileId).toBe("profile-2");
        expect(result.version.versionNumber).toBe(1);
        expect(result.version.kind).toBe("tailored");
        expect(result.version.source.label).toBe("Jane Doe Resume - Pattern");
        expect(result.version.lineage).toEqual({
            sourceResumeVersionId: "version-1",
            sourceJobId: "job-123",
        });
        expect(result.tailoredResume).toEqual({
            id: "profile-2",
            name: "Jane Doe Resume - Pattern",
            profileId: "profile-2",
            versionId: "version-2",
        });
        expect(result.suggestions).toHaveLength(1);
    });

    it("uses Tailored as the suffix when the job company is missing", async () => {
        const createTailoredResume = createDbCreateTailoredResume({
            jobs: {
                getJobById: async () => ({
                    id: "job-123",
                    company: "",
                }),
            },
            resumeProfiles: {
                getResumeProfileById: async () => ({
                    id: "profile-1",
                    name: "Jane Doe Resume",
                    currentVersionId: "version-1",
                }),
                createResumeProfile: async (input) => ({
                    id: "profile-2",
                    name: input.name,
                    currentVersionId: "",
                }),
                updateResumeProfileCurrentVersion: async () => null,
            },
            resumeVersions: {
                getResumeVersionById: async () => ({
                    id: "version-1",
                    profileId: "profile-1",
                    versionNumber: 1,
                    normalizedResume,
                }),
                createResumeVersion: async (input) => ({
                    id: "version-2",
                    kind: input.kind,
                }),
            },
        });

        const result = await createTailoredResume({
            profileId: "profile-1",
            jobId: "job-123",
            sourceResumeVersionId: "version-1",
        });

        expect(result.tailoredResume.name).toBe("Jane Doe Resume - Tailored");
        expect(result.version.source.label).toBe("Jane Doe Resume - Tailored");
    });
});
