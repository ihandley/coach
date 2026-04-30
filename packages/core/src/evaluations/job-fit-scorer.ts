import type {
    EvaluationResult,
    EvaluationReasoning,
    JobEvaluationRecord,
    RecommendationCategory,
} from "./types.ts";
import { RECOMMENDATION_CATEGORIES } from "./types.ts";

type Job = {
    id: string;
    company: string;
    title: string;
    sourceUrl: string;
    sourceText: string;
};

type ResumeProfile = {
    id: string;
    name: string;
};

type JobRepository = {
    getJobById(jobId: string): Promise<Job | null>;
};

type ResumeProfileRepository = {
    getResumeProfileById(resumeProfileId: string): Promise<ResumeProfile | null>;
};

type JobEvaluationRepository = {
    create(input: {
        jobId: string;
        resumeProfileId: string;
        score: number;
        recommendation: RecommendationCategory;
        reasoning: EvaluationReasoning;
    }): Promise<JobEvaluationRecord>;
};

export class JobFitScorerError extends Error {
    code: string;

    constructor(code: string, message: string) {
        super(message);
        this.name = "JobFitScorerError";
        this.code = code;
    }
}

type ScoreJobFitInput = {
    jobId: string;
    resumeProfileId: string;
};

type CreateJobFitScorerDeps = {
    jobs: JobRepository;
    resumeProfiles: ResumeProfileRepository;
    evaluations?: JobEvaluationRepository;
    evaluate?: (input: {
        job: Job;
        resumeProfile: ResumeProfile;
    }) => Promise<unknown>;
    fallbackOnInvalidEvaluationResult?: boolean;
};

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecommendationCategory(
    value: unknown,
): value is RecommendationCategory {
    return (
        typeof value === "string" &&
        RECOMMENDATION_CATEGORIES.includes(value as RecommendationCategory)
    );
}

function isEvaluationResult(value: unknown): value is EvaluationResult {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    const reasoning = candidate.reasoning;

    if (!reasoning || typeof reasoning !== "object") {
        return false;
    }

    const reasoningCandidate = reasoning as Record<string, unknown>;

    return (
        typeof candidate.score === "number" &&
        isRecommendationCategory(candidate.recommendation) &&
        isStringArray(reasoningCandidate.strengths) &&
        isStringArray(reasoningCandidate.gaps) &&
        isStringArray(reasoningCandidate.riskFactors) &&
        typeof reasoningCandidate.summary === "string"
    );
}

function createFallbackEvaluationResult(): EvaluationResult {
    return {
        score: 0,
        recommendation: "needs-review",
        reasoning: {
            strengths: [],
            gaps: [],
            riskFactors: ["Evaluator returned malformed output"],
            summary:
                "Automatic fit evaluation failed validation and requires manual review.",
        },
    };
}

export function createJobFitScorer({
    jobs,
    resumeProfiles,
    evaluations,
    evaluate,
    fallbackOnInvalidEvaluationResult = false,
}: CreateJobFitScorerDeps) {
    return {
        async scoreJobFit({ jobId, resumeProfileId }: ScoreJobFitInput) {
            const job = await jobs.getJobById(jobId);

            if (!job) {
                throw new JobFitScorerError("JOB_NOT_FOUND", `Job not found: ${jobId}`);
            }

            const resumeProfile =
                await resumeProfiles.getResumeProfileById(resumeProfileId);

            if (!resumeProfile) {
                throw new JobFitScorerError(
                    "RESUME_PROFILE_NOT_FOUND",
                    `Resume profile not found: ${resumeProfileId}`,
                );
            }

            if (!evaluate) {
                throw new JobFitScorerError(
                    "NOT_IMPLEMENTED",
                    "Scoring not implemented yet",
                );
            }

            const rawResult = await evaluate({
                job,
                resumeProfile,
            });

            let result: EvaluationResult;

            if (!isEvaluationResult(rawResult)) {
                if (!fallbackOnInvalidEvaluationResult) {
                    throw new JobFitScorerError(
                        "INVALID_EVALUATION_RESULT",
                        "Evaluator returned malformed output",
                    );
                }

                result = createFallbackEvaluationResult();
            } else {
                result = rawResult;
            }

            if (!evaluations) {
                return {
                    id: "unsaved-evaluation",
                    jobId,
                    resumeProfileId,
                    score: result.score,
                    recommendation: result.recommendation,
                    reasoning: result.reasoning,
                    createdAt: new Date().toISOString(),
                };
            }

            return await evaluations.create({
                jobId,
                resumeProfileId,
                score: result.score,
                recommendation: result.recommendation,
                reasoning: result.reasoning,
            });
        },
    };
}