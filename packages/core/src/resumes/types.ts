export type ResumeSource = {
    kind: string;
    label: string;
};

export type NormalizedResume = {
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

export type ResumeProfile = {
    id: string;
    name: string;
    currentVersionId: string;
};

export type ResumeVersion = {
    id: string;
    profileId: string;
    versionNumber: number;
    source: ResumeSource;
    normalizedResume: NormalizedResume;
};

export type BaselineResumeReview = {
    coreStrengths: string[];
    missingSignals: string[];
    concerns: string[];
    targetRoleAlignment: string[];
    recommendedImprovements: string[];
};