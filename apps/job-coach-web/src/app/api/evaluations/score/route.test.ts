import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/evaluations/score", () => {
    it("returns a scored evaluation", async () => {
        const request = new Request("http://localhost/api/evaluations/score", {
            method: "POST",
            body: JSON.stringify({
                jobId: "job-1",
                resumeProfileId: "resume-1",
            }),
        });

        const response = await POST(request, {
            server: {
                scoreJobFit: async () => ({
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
                }),
            },
        });

        expect(response.status).toBe(200);

        const json = await response.json();

        expect(json).toMatchObject({
            id: "evaluation-1",
            score: 82,
            recommendation: "good-fit",
        });
    });

    it("returns 400 for invalid input", async () => {
        const request = new Request("http://localhost/api/evaluations/score", {
            method: "POST",
            body: JSON.stringify({}),
        });

        const response = await POST(request, {
            server: {
                scoreJobFit: async () => {
                    throw new Error("should not be called");
                },
            },
        });

        expect(response.status).toBe(400);
    });
});