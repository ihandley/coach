import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";

import { EvaluationPanel } from "./evaluation-panel";

afterEach(() => cleanup());

describe("EvaluationPanel", () => {
    it("shows the latest evaluation score when one exists", async () => {
        render(
            createElement(EvaluationPanel, {
                jobId: "job-1",
                resumeProfileId: "resume-1",
                getLatestEvaluation: vi.fn(async () => ({
                    id: "evaluation-1",
                    jobId: "job-1",
                    resumeProfileId: "resume-1",
                    score: 82,
                    recommendation: "good-fit",
                    reasoning: {
                        strengths: ["Strong TypeScript alignment"],
                        gaps: [],
                        riskFactors: [],
                        summary: "Solid match",
                    },
                    createdAt: new Date().toISOString(),
                })),
                scoreJobFit: vi.fn(),
            }),
        );

        expect(await screen.findByText("82")).toBeInTheDocument();
    });

    it("shows an empty state when no evaluation exists", async () => {
        render(
            createElement(EvaluationPanel, {
                jobId: "job-1",
                resumeProfileId: "resume-1",
                getLatestEvaluation: vi.fn(async () => null),
                scoreJobFit: vi.fn(),
            }),
        );

        expect(await screen.findByText("No evaluation yet.")).toBeInTheDocument();
    });

    it("scores the job when the button is clicked", async () => {
        const scoreJobFit = vi.fn(async () => ({
            id: "evaluation-1",
            jobId: "job-1",
            resumeProfileId: "resume-1",
            score: 76,
            recommendation: "good-fit",
            reasoning: {
                strengths: ["Relevant experience"],
                gaps: [],
                riskFactors: [],
                summary: "Promising fit",
            },
            createdAt: new Date().toISOString(),
        }));

        render(
            createElement(EvaluationPanel, {
                jobId: "job-1",
                resumeProfileId: "resume-1",
                getLatestEvaluation: vi.fn(async () => null),
                scoreJobFit,
            }),
        );

        fireEvent.click(
            await screen.findByRole("button", {
                name: "Score job fit",
            }),
        );

        await waitFor(() => {
            expect(scoreJobFit).toHaveBeenCalledWith({
                jobId: "job-1",
                resumeProfileId: "resume-1",
            });
            expect(screen.getByText("76")).toBeInTheDocument();
        });
    });

    it("shows a loading state while refreshing", async () => {
        render(
            createElement(EvaluationPanel, {
                jobId: "job-1",
                resumeProfileId: "resume-1",
                getLatestEvaluation: vi.fn(() => new Promise<null>(() => {})),
                scoreJobFit: vi.fn(),
            }),
        );

        expect(screen.getByText("Loading evaluation...")).toBeInTheDocument();
    });
});
