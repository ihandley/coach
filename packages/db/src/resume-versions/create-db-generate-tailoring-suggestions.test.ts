import { describe, expect, it } from "vitest";

import { createDbGenerateTailoringSuggestions } from "./create-db-generate-tailoring-suggestions";

describe("createDbGenerateTailoringSuggestions", () => {
    it("creates a DB-backed tailoring suggestion service", async () => {
        const resumeProfiles = {
            getResumeProfileById: async (resumeProfileId: string) =>
                resumeProfileId === "profile-1"
                    ? {
                        id: "profile-1",
                        name: "Jane Doe Resume",
                        currentVersionId: "version-1",
                    }
                    : null,
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
        };

        const generateTailoringSuggestions = createDbGenerateTailoringSuggestions({
            resumeProfiles,
            resumeVersions,
            generateSuggestions: async () => [
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

        const result = await generateTailoringSuggestions({
            profileId: "profile-1",
            jobId: "job-123",
            sourceResumeVersionId: "version-1",
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            id: "suggestion-1",
            sectionTarget: "summary",
            priority: "high",
            confidence: "high",
        });
    });
});