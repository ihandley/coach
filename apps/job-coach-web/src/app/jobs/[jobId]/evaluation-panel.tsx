"use client";

import { createElement, useEffect, useState } from "react";

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

export function EvaluationPanel({
    jobId,
    resumeProfileId,
    getLatestEvaluation,
    scoreJobFit,
}: {
    jobId: string;
    resumeProfileId: string;
    getLatestEvaluation: (input: {
        jobId: string;
        resumeProfileId: string;
    }) => Promise<Evaluation | null>;
    scoreJobFit: (input: {
        jobId: string;
        resumeProfileId: string;
    }) => Promise<Evaluation>;
}) {
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isScoring, setIsScoring] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function loadEvaluation() {
            const latestEvaluation = await getLatestEvaluation({
                jobId,
                resumeProfileId,
            });

            if (isMounted) {
                setEvaluation(latestEvaluation);
                setIsLoading(false);
            }
        }

        void loadEvaluation();

        return () => {
            isMounted = false;
        };
    }, [getLatestEvaluation, jobId, resumeProfileId]);

    async function handleScoreFit() {
        setIsScoring(true);

        const nextEvaluation = await scoreJobFit({
            jobId,
            resumeProfileId,
        });

        setEvaluation(nextEvaluation);
        setIsScoring(false);
    }

    if (isLoading) {
        return createElement("p", {}, "Loading evaluation...");
    }

    return createElement(
        "section",
        {},
        createElement("h2", {}, "Fit evaluation"),
        createElement(
            "button",
            {
                type: "button",
                onClick: handleScoreFit,
                disabled: isScoring,
            },
            isScoring ? "Scoring..." : "Score job fit",
        ),
        evaluation
            ? createElement(
                  "div",
                  {},
                  createElement("p", {}, String(evaluation.score)),
                  createElement("p", {}, evaluation.recommendation),
                  createElement("p", {}, evaluation.reasoning.summary),
              )
            : createElement("p", {}, "No evaluation yet."),
    );
}
