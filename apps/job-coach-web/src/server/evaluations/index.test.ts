import { describe, expect, it, vi } from "vitest";

describe("createEvaluationsServer", () => {
    it("returns the final app-facing server for scoring and latest evaluation lookup", async () => {
        const { createEvaluationsServer } = await import("./index");

        const server = createEvaluationsServer({
            db: {} as never,
            jobs: {} as never,
            evaluate: vi.fn(),
            fallbackOnInvalidEvaluationResult: false,
        });

        expect(server).toEqual(
            expect.objectContaining({
                scoreJobFit: expect.any(Function),
                getLatestEvaluation: expect.any(Function),
            }),
        );
    });
});