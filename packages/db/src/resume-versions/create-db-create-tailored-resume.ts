import { createCreateTailoredResume } from "@coach/core";

export function createDbCreateTailoredResume({
    resumeProfiles,
    resumeVersions,
    generateTailoringSuggestions,
}: {
    resumeProfiles: {
        getResumeProfileById(resumeProfileId: string): Promise<any>;
        updateResumeProfileCurrentVersion(input: {
            resumeProfileId: string;
            currentVersionId: string;
        }): Promise<any>;
    };
    resumeVersions: {
        getResumeVersionById(resumeVersionId: string): Promise<any>;
        createResumeVersion(input: {
            id?: string;
            profileId: string;
            versionNumber: number;
            kind: "tailored";
            source: {
                kind: string;
                label: string;
            };
            normalizedResume: any;
            lineage?: {
                sourceResumeVersionId?: string;
                sourceJobId?: string;
            };
        }): Promise<any>;
        listResumeVersionsByProfileId(profileId: string): Promise<any[]>;
    };
    generateTailoringSuggestions(input: {
        profileId: string;
        jobId: string;
        sourceResumeVersionId: string;
    }): Promise<unknown>;
}) {
    return createCreateTailoredResume({
        resumeProfiles,
        resumeVersions,
        generateTailoringSuggestions,
    });
}