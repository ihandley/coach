export type Evaluation = {
    id: string;
    jobId: string;
    resumeProfileId: string;
    score: number;
    recommendation: string;
    reasoning: {
        strengths: string[];
        gaps: string[];
        riskFactors: string[];
        summary: string;
    };
    createdAt: string;
};

export async function getLatestEvaluation(input: {
    jobId: string;
    resumeProfileId: string;
}): Promise<Evaluation | null> {
    const response = await fetch(
        `/api/evaluations/latest?jobId=${encodeURIComponent(input.jobId)}&resumeProfileId=${encodeURIComponent(input.resumeProfileId)}`,
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error("Failed to load latest evaluation");
    }

    return response.json();
}

export async function scoreJobFit(input: {
    jobId: string;
    resumeProfileId: string;
}): Promise<Evaluation> {
    const response = await fetch("/api/evaluations/score", {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error("Failed to score job fit");
    }

    return response.json();
}