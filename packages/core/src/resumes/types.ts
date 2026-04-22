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

export type ResumeVersionKind = "baseline" | "tailored";

export type TailoringSuggestion = {
    id: string;
    sectionTarget: string;
    originalContent: string;
    suggestedContent: string;
    rationale: string;
    relatedJobRequirements: string[];
    priority: "low" | "medium" | "high";
    confidence: "low" | "medium" | "high";
};

export type ResumeVersionLineage = {
    sourceResumeVersionId?: string;
    sourceJobId?: string;
};

export type ResumeVersion = {
    id: string;
    profileId: string;
    versionNumber: number;
    kind: ResumeVersionKind;
    source: ResumeSource;
    normalizedResume: NormalizedResume;
    lineage?: ResumeVersionLineage;
};

export type TailoredResume = {
    version: ResumeVersion;
    suggestions: TailoringSuggestion[];
};

export type BaselineResumeReview = {
    coreStrengths: string[];
    missingSignals: string[];
    concerns: string[];
    targetRoleAlignment: string[];
    recommendedImprovements: string[];
};