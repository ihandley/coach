"use client";

import { createElement } from "react";
import { EvaluationPanelClient } from "./evaluation-panel-client";

export function JobPageClient({ jobId }: { jobId: string }) {
    return createElement(
        "main",
        {},
        createElement("h1", {}, `Job ${jobId}`),
        createElement(EvaluationPanelClient, {
            jobId,
            resumeProfileId: "resume-1",
        }),
    );
}
