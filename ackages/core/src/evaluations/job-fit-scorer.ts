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

type EvaluationReasoning = {
    strengths: string[];
    gaps: string[];
    riskFactors: string[];
    summary: string;
};

type EvaluationResult = {
    score: number;
    recommendation: string;
    reasoning: EvaluationReasoning;
};

type JobRepository = {
    getJobById(jobId: string): Promise<Job | null>;
};

type ResumeProfileRepository = {
    getResumeProfileById(resumeProfileId: string): Promise<ResumeProfile | null>;
};

type JobEvaluationRecord = {
    id: string;
    jobId: string;
    resumeProfileId: string;
    score: number;
    recommendation: string;
    reasoning: EvaluationReasoning;
    createdAt: string;
};

type JobEvaluationRepository = {
    create(input: {
        jobId: string;
        resumeProfileId: string;
        score: number;
        recommendation: string;
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
};

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
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
        typeof candidate.recommendation === "string" &&
        isStringArray(reasoningCandidate.strengths) &&
        isStringArray(reasoningCandidate.gaps) &&
        isStringArray(reasoningCandidate.riskFactors) &&
        typeof reasoningCandidate.summary === "string"
    );
}

export function createJobFitScorer({
    jobs,
    resumeProfiles,
    evaluations,
    evaluate,
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

            if (!isEvaluationResult(rawResult)) {
                throw new JobFitScorerError(
                    "INVALID_EVALUATION_RESULT",
                    "Evaluator returned malformed output",
                );
            }

            if (!evaluations) {
                return {
                    id: "unsaved-evaluation",
                    jobId,
                    resumeProfileId,
                    score: rawResult.score,
                    recommendation: rawResult.recommendation,
                    reasoning: rawResult.reasoning,
                    createdAt: new Date().toISOString(),
                };
            }

            return evaluations.create({
                jobId,
                resumeProfileId,
                score: rawResult.score,
                recommendation: rawResult.recommendation,
                reasoning: rawResult.reasoning,
            });
        },
    };
}