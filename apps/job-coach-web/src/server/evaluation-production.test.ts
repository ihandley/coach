import { describe, expect, it, vi } from "vitest";

describe("createEvaluationProductionEntry", () => {
    it("returns an evaluation entry with score and latest methods", async () => {
        const { createEvaluationProductionEntry } = await import(
            "./evaluation-production"
        );

        const entry = createEvaluationProductionEntry({
            db: {} as never,
            jobs: {} as never,
            evaluate: vi.fn(),
            fallbackOnInvalidEvaluationResult: false,
        });

        expect(entry).toEqual(
            expect.objectContaining({
                scoreJobFit: expect.any(Function),
                getLatestEvaluation: expect.any(Function),
            }),
        );
    });
});