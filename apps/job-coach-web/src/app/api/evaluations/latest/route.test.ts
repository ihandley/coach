import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/evaluations/latest", () => {
    it("returns the latest evaluation", async () => {
        const request = new Request(
            "http://localhost/api/evaluations/latest?jobId=job-1&resumeProfileId=resume-1",
        );

        const response = await GET(request, {
            server: {
                getLatestEvaluation: async () => ({
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
        });
    });

    it("returns 400 when query params are missing", async () => {
        const request = new Request("http://localhost/api/evaluations/latest");

        const response = await GET(request, {
            server: {
                getLatestEvaluation: async () => null,
            },
        });

        expect(response.status).toBe(400);
    });

    it("returns 404 when no evaluation exists", async () => {
        const request = new Request(
            "http://localhost/api/evaluations/latest?jobId=job-1&resumeProfileId=resume-1",
        );

        const response = await GET(request, {
            server: {
                getLatestEvaluation: async () => null,
            },
        });

        expect(response.status).toBe(404);
    });
});