"use client";

import { createElement } from "react";
import { EvaluationPanel } from "./evaluation-panel";
import { evaluationsClient } from "../../../server/evaluations/client";

export function EvaluationPanelClient({
    jobId,
    resumeProfileId,
}: {
    jobId: string;
    resumeProfileId: string;
}) {
    return createElement(EvaluationPanel, {
        jobId,
        resumeProfileId,
        getLatestEvaluation: evaluationsClient.getLatestEvaluation,
        scoreJobFit: evaluationsClient.scoreJobFit,
    });
}
