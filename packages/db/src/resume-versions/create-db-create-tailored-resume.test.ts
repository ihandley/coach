import { describe, expect, it } from "vitest";

import { createDbCreateTailoredResume } from "./create-db-create-tailored-resume.ts";

describe("createDbCreateTailoredResume", () => {
    it("creates a DB-backed tailored resume service", async () => {
        const resumeProfiles = {
            getResumeProfileById: async (resumeProfileId: string) =>
                resumeProfileId === "profile-1"
                    ? {
                        id: "profile-1",
                        name: "Jane Doe Resume",
                        currentVersionId: "version-1",
                    }
                    : null,
            updateResumeProfileCurrentVersion: async ({
                resumeProfileId,
                currentVersionId,
            }: {
                resumeProfileId: string;
                currentVersionId: string;
            }) => ({
                id: resumeProfileId,
                name: "Jane Doe Resume",
                currentVersionId,
            }),
        };

        const resumeVersions = {
            getResumeVersionById: async (resumeVersionId: string) =>
                resumeVersionId === "version-1"
                    ? {
                        id: "version-1",
                        profileId: "profile-1",
                        versionNumber: 1,
                        kind: "baseline" as const,
                        source: {
                            kind: "upload",
                            label: "Resume.pdf",
                        },
                        normalizedResume: {
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
                        },
                    }
                    : null,
            createResumeVersion: async (input: {
                profileId: string;
                versionNumber: number;
                kind: "tailored";
                source: {
                    kind: string;
                    label: string;
                };
                normalizedResume: {
                    basics: {
                        fullName: string;
                        headline: string;
                        summary: string;
                    };
                    skills: string[];
                    experience: Array<{
                        company: string;
                        title: string;
                        highlights: string[];
                    }>;
                    education: unknown[];
                };
                lineage?: {
                    sourceResumeVersionId?: string;
                    sourceJobId?: string;
                };
            }) => ({
                id: "version-2",
                ...input,
            }),
            listResumeVersionsByProfileId: async () => [
                {
                    id: "version-1",
                    profileId: "profile-1",
                    versionNumber: 1,
                    kind: "baseline" as const,
                    source: {
                        kind: "upload",
                        label: "Resume.pdf",
                    },
                    normalizedResume: {
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
                    },
                },
            ],
        };

        const createTailoredResume = createDbCreateTailoredResume({
            resumeProfiles,
            resumeVersions,
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

        expect(result.version.id).toBe("version-2");
        expect(result.version.kind).toBe("tailored");
        expect(result.version.lineage).toEqual({
            sourceResumeVersionId: "version-1",
            sourceJobId: "job-123",
        });
        expect(result.suggestions).toHaveLength(1);
    });
});