import { describe, expect, it } from "vitest";

import { createGenerateTailoringSuggestions } from "./generate-tailoring-suggestions.ts";
import { createInMemoryResumeProfileRepository } from "./in-memory-resume-profile-repository.ts";
import { createInMemoryResumeVersionRepository } from "./in-memory-resume-version-repository.ts";
import type { NormalizedResume, TailoringSuggestion } from "./types.ts";

function makeResume(): NormalizedResume {
    return {
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
                highlights: ["Built internal APIs", "Improved CI pipeline"],
            },
        ],
        education: [],
    };
}

function makeSuggestions(): TailoringSuggestion[] {
    return [
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
    ];
}

describe("createGenerateTailoringSuggestions", () => {
    it("generates structured tailoring suggestions for a profile, job, and source version", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });

        await resumeVersions.createResumeVersion({
            id: "version-1",
            profileId: "profile-1",
            versionNumber: 1,
            kind: "baseline",
            source: {
                kind: "upload",
                label: "Resume.pdf",
            },
            normalizedResume: makeResume(),
        });

        const generateTailoringSuggestions = createGenerateTailoringSuggestions({
            resumeProfiles,
            resumeVersions,
            generateSuggestions: async () => makeSuggestions(),
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

    it("throws when the resume profile does not exist", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        const generateTailoringSuggestions = createGenerateTailoringSuggestions({
            resumeProfiles,
            resumeVersions,
            generateSuggestions: async () => makeSuggestions(),
        });

        await expect(
            generateTailoringSuggestions({
                profileId: "missing-profile",
                jobId: "job-123",
                sourceResumeVersionId: "version-1",
            }),
        ).rejects.toThrow("RESUME_PROFILE_NOT_FOUND");
    });

    it("throws when the source resume version does not exist", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });

        const generateTailoringSuggestions = createGenerateTailoringSuggestions({
            resumeProfiles,
            resumeVersions,
            generateSuggestions: async () => makeSuggestions(),
        });

        await expect(
            generateTailoringSuggestions({
                profileId: "profile-1",
                jobId: "job-123",
                sourceResumeVersionId: "missing-version",
            }),
        ).rejects.toThrow("RESUME_VERSION_NOT_FOUND");
    });

    it("throws when the source resume version belongs to a different profile", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });

        await resumeProfiles.createResumeProfile({
            id: "profile-2",
            name: "Other Resume",
            currentVersionId: "version-99",
        });

        await resumeVersions.createResumeVersion({
            id: "version-99",
            profileId: "profile-2",
            versionNumber: 1,
            kind: "baseline",
            source: {
                kind: "upload",
                label: "Other.pdf",
            },
            normalizedResume: makeResume(),
        });

        const generateTailoringSuggestions = createGenerateTailoringSuggestions({
            resumeProfiles,
            resumeVersions,
            generateSuggestions: async () => makeSuggestions(),
        });

        await expect(
            generateTailoringSuggestions({
                profileId: "profile-1",
                jobId: "job-123",
                sourceResumeVersionId: "version-99",
            }),
        ).rejects.toThrow("RESUME_VERSION_PROFILE_MISMATCH");
    });

    it("throws when generated suggestions are malformed", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });

        await resumeVersions.createResumeVersion({
            id: "version-1",
            profileId: "profile-1",
            versionNumber: 1,
            kind: "baseline",
            source: {
                kind: "upload",
                label: "Resume.pdf",
            },
            normalizedResume: makeResume(),
        });

        const generateTailoringSuggestions = createGenerateTailoringSuggestions({
            resumeProfiles,
            resumeVersions,
            generateSuggestions: async () =>
                [
                    {
                        id: "suggestion-1",
                        sectionTarget: "summary",
                        originalContent: "old",
                        suggestedContent: "new",
                        rationale: "reason",
                        relatedJobRequirements: ["payments"],
                        priority: "urgent",
                        confidence: "high",
                    },
                ] as never,
        });

        await expect(
            generateTailoringSuggestions({
                profileId: "profile-1",
                jobId: "job-123",
                sourceResumeVersionId: "version-1",
            }),
        ).rejects.toThrow("INVALID_TAILORING_SUGGESTIONS");
    });
});