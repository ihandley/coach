import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EvaluationPanel } from "./evaluation-panel";

afterEach(() => {
    cleanup();
});

describe("EvaluationPanel", () => {
    it("loads and displays the latest evaluation", async () => {
        const getLatestEvaluation = vi.fn().mockResolvedValue({
            id: "evaluation-1",
            jobId: "job-1",
            resumeProfileId: "resume-1",
            score: 82,
            recommendation: "good-fit",
            reasoning: {
                strengths: ["Strong TypeScript alignment"],
                gaps: ["No explicit Postgres signal"],
                riskFactors: [],
                summary: "Solid match with a small database gap.",
            },
            createdAt: new Date().toISOString(),
        });

        render(
            <EvaluationPanel
                jobId="job-1"
                resumeProfileId="resume-1"
                getLatestEvaluation={getLatestEvaluation}
                scoreJobFit={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(screen.getByText("82")).toBeInTheDocument();
        });

        expect(screen.getByText("good-fit")).toBeInTheDocument();
        expect(
            screen.getByText("Solid match with a small database gap."),
        ).toBeInTheDocument();
    });

    it("shows an error when loading the latest evaluation fails", async () => {
        render(
            <EvaluationPanel
                jobId="job-1"
                resumeProfileId="resume-1"
                getLatestEvaluation={vi.fn().mockRejectedValue(new Error("boom"))}
                scoreJobFit={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(
                screen.getByText("Failed to load latest evaluation."),
            ).toBeInTheDocument();
        });
    });

    it("scores the job when the button is clicked", async () => {
        const scoreJobFit = vi.fn().mockResolvedValue({
            id: "evaluation-2",
            jobId: "job-1",
            resumeProfileId: "resume-1",
            score: 76,
            recommendation: "stretch",
            reasoning: {
                strengths: ["Backend experience is relevant"],
                gaps: ["Database depth is still unclear"],
                riskFactors: ["Role may expect stronger Postgres evidence"],
                summary: "Possible fit, but risk increased on re-evaluation.",
            },
            createdAt: new Date().toISOString(),
        });

        render(
            <EvaluationPanel
                jobId="job-1"
                resumeProfileId="resume-1"
                getLatestEvaluation={vi.fn().mockResolvedValue(null)}
                scoreJobFit={scoreJobFit}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Score fit" }));

        await waitFor(() => {
            expect(screen.getByText("76")).toBeInTheDocument();
        });

        expect(scoreJobFit).toHaveBeenCalledWith({
            jobId: "job-1",
            resumeProfileId: "resume-1",
        });
        expect(screen.getByText("stretch")).toBeInTheDocument();
    });

    it("shows an error when scoring fails", async () => {
        render(
            <EvaluationPanel
                jobId="job-1"
                resumeProfileId="resume-1"
                getLatestEvaluation={vi.fn().mockResolvedValue(null)}
                scoreJobFit={vi.fn().mockRejectedValue(new Error("boom"))}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Score fit" }));

        await waitFor(() => {
            expect(screen.getByText("Failed to score fit evaluation.")).toBeInTheDocument();
        });
    });
});