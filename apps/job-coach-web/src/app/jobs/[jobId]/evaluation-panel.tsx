"use client";

import { useEffect, useState } from "react";

type Evaluation = {
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

type Props = {
    jobId: string;
    resumeProfileId: string;
    getLatestEvaluation(input: {
        jobId: string;
        resumeProfileId: string;
    }): Promise<Evaluation | null>;
    scoreJobFit(input: {
        jobId: string;
        resumeProfileId: string;
    }): Promise<Evaluation>;
};

export function EvaluationPanel({
    jobId,
    resumeProfileId,
    getLatestEvaluation,
    scoreJobFit,
}: Props) {
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [isScoring, setIsScoring] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [scoreError, setScoreError] = useState<string | null>(null);

    useEffect(() => {
        setLoadError(null);

        void getLatestEvaluation({ jobId, resumeProfileId })
            .then(setEvaluation)
            .catch(() => {
                setLoadError("Failed to load latest evaluation.");
            });
    }, [getLatestEvaluation, jobId, resumeProfileId]);

    async function handleScoreFit() {
        setIsScoring(true);
        setScoreError(null);

        try {
            const nextEvaluation = await scoreJobFit({
                jobId,
                resumeProfileId,
            });

            setEvaluation(nextEvaluation);
        } catch {
            setScoreError("Failed to score fit evaluation.");
        } finally {
            setIsScoring(false);
        }
    }

    return (
        <section>
            <h2>Fit evaluation</h2>

            <button type="button" onClick={handleScoreFit} disabled={isScoring}>
                {isScoring ? "Scoring..." : "Score fit"}
            </button>

            {loadError ? <p>{loadError}</p> : null}
            {scoreError ? <p>{scoreError}</p> : null}

            {evaluation ? (
                <div>
                    <p>{evaluation.score}</p>
                    <p>{evaluation.recommendation}</p>
                    <p>{evaluation.reasoning.summary}</p>
                </div>
            ) : (
                <p>No evaluation yet.</p>
            )}
        </section>
    );
}