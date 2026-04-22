import type {
    ResumeProfile,
    ResumeVersion,
    TailoringSuggestion,
} from "./types";

type ResumeProfileRepository = {
    getResumeProfileById(resumeProfileId: string): Promise<ResumeProfile | null>;
};

type ResumeVersionRepository = {
    getResumeVersionById(resumeVersionId: string): Promise<ResumeVersion | null>;
};

function isPriority(value: unknown): value is "low" | "medium" | "high" {
    return value === "low" || value === "medium" || value === "high";
}

function isConfidence(value: unknown): value is "low" | "medium" | "high" {
    return value === "low" || value === "medium" || value === "high";
}

function isTailoringSuggestion(value: unknown): value is TailoringSuggestion {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.id === "string" &&
        typeof candidate.sectionTarget === "string" &&
        typeof candidate.originalContent === "string" &&
        typeof candidate.suggestedContent === "string" &&
        typeof candidate.rationale === "string" &&
        Array.isArray(candidate.relatedJobRequirements) &&
        candidate.relatedJobRequirements.every(
            (requirement) => typeof requirement === "string",
        ) &&
        isPriority(candidate.priority) &&
        isConfidence(candidate.confidence)
    );
}

function assertValidTailoringSuggestions(
    suggestions: unknown,
): asserts suggestions is TailoringSuggestion[] {
    if (
        !Array.isArray(suggestions) ||
        !suggestions.every((suggestion) => isTailoringSuggestion(suggestion))
    ) {
        throw new Error("INVALID_TAILORING_SUGGESTIONS");
    }
}

export function createGenerateTailoringSuggestions({
    resumeProfiles,
    resumeVersions,
    generateSuggestions,
}: {
    resumeProfiles: ResumeProfileRepository;
    resumeVersions: ResumeVersionRepository;
    generateSuggestions(input: {
        profileId: string;
        jobId: string;
        sourceResumeVersionId: string;
        sourceResume: ResumeVersion["normalizedResume"];
    }): Promise<unknown>;
}) {
    return async function generateTailoringSuggestions(input: {
        profileId: string;
        jobId: string;
        sourceResumeVersionId: string;
    }): Promise<TailoringSuggestion[]> {
        const profile = await resumeProfiles.getResumeProfileById(input.profileId);

        if (!profile) {
            throw new Error("RESUME_PROFILE_NOT_FOUND");
        }

        const sourceVersion = await resumeVersions.getResumeVersionById(
            input.sourceResumeVersionId,
        );

        if (!sourceVersion) {
            throw new Error("RESUME_VERSION_NOT_FOUND");
        }

        if (sourceVersion.profileId !== input.profileId) {
            throw new Error("RESUME_VERSION_PROFILE_MISMATCH");
        }

        const suggestions = await generateSuggestions({
            profileId: input.profileId,
            jobId: input.jobId,
            sourceResumeVersionId: input.sourceResumeVersionId,
            sourceResume: sourceVersion.normalizedResume,
        });

        assertValidTailoringSuggestions(suggestions);

        return suggestions;
    };
}