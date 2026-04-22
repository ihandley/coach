import type {
    BaselineResumeReview,
    NormalizedResume,
} from "./types";

export async function createBaselineResumeReview(
    resume: NormalizedResume,
): Promise<BaselineResumeReview> {
    const coreStrengths: string[] = [];
    const missingSignals: string[] = [];
    const concerns: string[] = [];
    const targetRoleAlignment: string[] = [];
    const recommendedImprovements: string[] = [];

    if (resume.basics.headline) {
        coreStrengths.push("Includes a clear professional headline.");
        targetRoleAlignment.push(`Signals alignment to ${resume.basics.headline} roles.`);
    } else {
        missingSignals.push("Missing a professional headline.");
        recommendedImprovements.push("Add a clear target-role headline.");
    }

    if (resume.basics.summary) {
        coreStrengths.push("Includes a professional summary.");
    } else {
        concerns.push("No professional summary is present.");
        recommendedImprovements.push("Add a concise summary highlighting strengths and direction.");
    }

    if (resume.skills.length > 0) {
        coreStrengths.push("Includes explicit skills.");
    } else {
        missingSignals.push("No skills section is present.");
        recommendedImprovements.push("Add a skills section with relevant tools and technologies.");
    }

    if (resume.experience.length > 0) {
        coreStrengths.push("Includes work experience.");
    } else {
        concerns.push("No work experience entries are present.");
        recommendedImprovements.push("Add work experience entries with measurable impact.");
    }

    const hasHighlights = resume.experience.some(
        (entry) => Array.isArray(entry.highlights) && entry.highlights.length > 0,
    );

    if (!hasHighlights) {
        concerns.push("Experience entries do not include bullet-level highlights.");
        recommendedImprovements.push("Add bullet points describing outcomes, scope, and impact.");
    }

    return {
        coreStrengths,
        missingSignals,
        concerns,
        targetRoleAlignment,
        recommendedImprovements,
    };
}