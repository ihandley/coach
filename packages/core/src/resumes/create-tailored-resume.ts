import type {
    ResumeProfile,
    ResumeVersion,
    TailoredResume,
    TailoringSuggestion,
} from "./types";

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

type ResumeProfileRepository = {
    getResumeProfileById(resumeProfileId: string): Promise<ResumeProfile | null>;
    updateResumeProfileCurrentVersion(input: {
        resumeProfileId: string;
        currentVersionId: string;
    }): Promise<ResumeProfile | null>;
};

type ResumeVersionRepository = {
    getResumeVersionById(resumeVersionId: string): Promise<ResumeVersion | null>;
    createResumeVersion(input: {
        id?: string;
        profileId: string;
        versionNumber: number;
        kind: "tailored";
        source: ResumeVersion["source"];
        normalizedResume: ResumeVersion["normalizedResume"];
        lineage?: ResumeVersion["lineage"];
    }): Promise<ResumeVersion>;
    listResumeVersionsByProfileId(profileId: string): Promise<ResumeVersion[]>;
};

export function createCreateTailoredResume({
    resumeProfiles,
    resumeVersions,
    generateTailoringSuggestions,
}: {
    resumeProfiles: ResumeProfileRepository;
    resumeVersions: ResumeVersionRepository;
    generateTailoringSuggestions(input: {
        profileId: string;
        jobId: string;
        sourceResumeVersionId: string;
    }): Promise<unknown>;
}) {
    return async function createTailoredResume(input: {
        profileId: string;
        jobId: string;
        sourceResumeVersionId: string;
    }): Promise<TailoredResume> {
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

        const existingVersions = await resumeVersions.listResumeVersionsByProfileId(
            input.profileId,
        );

        const nextVersionNumber =
            existingVersions.length === 0
                ? 1
                : Math.max(...existingVersions.map((version) => version.versionNumber)) + 1;

        const suggestions = await generateTailoringSuggestions({
            profileId: input.profileId,
            jobId: input.jobId,
            sourceResumeVersionId: input.sourceResumeVersionId,
        });

        assertValidTailoringSuggestions(suggestions);

        const version = await resumeVersions.createResumeVersion({
            profileId: input.profileId,
            versionNumber: nextVersionNumber,
            kind: "tailored",
            source: {
                kind: "tailored",
                label: `Tailored resume for ${input.jobId}`,
            },
            normalizedResume: sourceVersion.normalizedResume,
            lineage: {
                sourceResumeVersionId: input.sourceResumeVersionId,
                sourceJobId: input.jobId,
            },
        });

        await resumeProfiles.updateResumeProfileCurrentVersion({
            resumeProfileId: input.profileId,
            currentVersionId: version.id,
        });

        return {
            version,
            suggestions,
        };
    };
}