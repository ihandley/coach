import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";

vi.mock("./evaluation-panel", () => ({
    EvaluationPanel: ({
        jobId,
        resumeProfileId,
    }: {
        jobId: string;
        resumeProfileId: string;
    }) =>
        createElement(
            "section",
            {},
            createElement("h2", {}, "Fit evaluation"),
            createElement("p", {}, `jobId=${jobId}`),
            createElement("p", {}, `resumeProfileId=${resumeProfileId}`),
        ),
}));

import { JobPageClient } from "./job-page-client";

describe("JobPage", () => {
    it("renders the job heading and evaluation panel", () => {
        render(createElement(JobPageClient, { jobId: "job-123" }));

        expect(screen.getByText("Job job-123")).toBeInTheDocument();
        expect(screen.getByText("Fit evaluation")).toBeInTheDocument();
        expect(screen.getByText("jobId=job-123")).toBeInTheDocument();
        expect(screen.getByText("resumeProfileId=resume-1")).toBeInTheDocument();
    });
});
