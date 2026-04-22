import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./evaluation-client", () => ({
    getLatestEvaluation: vi.fn().mockResolvedValue(null),
    scoreJobFit: vi.fn().mockResolvedValue({
        id: "evaluation-1",
        jobId: "job-123",
        resumeProfileId: "resume-123",
        score: 82,
        recommendation: "good-fit",
        reasoning: {
            strengths: ["Strong TypeScript alignment"],
            gaps: ["No explicit Postgres signal"],
            riskFactors: [],
            summary: "Solid match with a small database gap.",
        },
        createdAt: new Date().toISOString(),
    }),
}));

import JobPage from "./page";

describe("JobPage", () => {
    it("renders the job heading and evaluation panel", () => {
        render(<JobPage params={{ jobId: "job-123" }} />);

        expect(screen.getByText("Job job-123")).toBeInTheDocument();
        expect(screen.getByText("Fit evaluation")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Score fit" }),
        ).toBeInTheDocument();
    });
});