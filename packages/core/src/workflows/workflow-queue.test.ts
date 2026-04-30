import { describe, expect, it, vi } from "vitest";
import { createInMemoryWorkflowRunRepository } from "./in-memory-workflow-run-repository.ts";
import { createWorkflowQueue } from "./workflow-queue.ts";

describe("createWorkflowQueue", () => {
    it("processes queued jobs in order", async () => {
        const repository = createInMemoryWorkflowRunRepository();
        const queue = createWorkflowQueue({
            workflowRunRepository: repository,
        });

        const runOne = await repository.createWorkflowRun({
            workflowType: "workflow-one",
            input: {},
        });

        const runTwo = await repository.createWorkflowRun({
            workflowType: "workflow-two",
            input: {},
        });

        const calls: string[] = [];

        await queue.enqueue({
            workflowRunId: runOne.id,
            steps: [
                {
                    stepKey: "step-one",
                    run: async () => {
                        calls.push("run-one");
                    },
                },
            ],
        });

        await queue.enqueue({
            workflowRunId: runTwo.id,
            steps: [
                {
                    stepKey: "step-two",
                    run: async () => {
                        calls.push("run-two");
                    },
                },
            ],
        });

        expect(calls).toEqual(["run-one", "run-two"]);

        const updatedRunOne = await repository.getWorkflowRunById(runOne.id);
        const updatedRunTwo = await repository.getWorkflowRunById(runTwo.id);

        expect(updatedRunOne).toMatchObject({
            status: "succeeded",
        });
        expect(updatedRunTwo).toMatchObject({
            status: "succeeded",
        });
        expect(queue.getPendingCount()).toBe(0);
        expect(queue.isProcessing()).toBe(false);
    });

    it("marks a run as failed when a queued job step exhausts retries", async () => {
        const repository = createInMemoryWorkflowRunRepository();
        const queue = createWorkflowQueue({
            workflowRunRepository: repository,
        });

        const run = await repository.createWorkflowRun({
            workflowType: "workflow-failure",
            input: {},
        });

        const failingStep = vi
            .fn()
            .mockRejectedValue(new Error("QUEUE_STEP_FAILED"));

        await expect(
            queue.enqueue({
                workflowRunId: run.id,
                steps: [
                    {
                        stepKey: "always-fails",
                        run: failingStep,
                    },
                ],
                maxAttemptsPerStep: 2,
            }),
        ).rejects.toThrow("QUEUE_STEP_FAILED");

        expect(failingStep).toHaveBeenCalledTimes(2);

        const updatedRun = await repository.getWorkflowRunById(run.id);
        const steps = await repository.listWorkflowStepsByRunId(run.id);

        expect(updatedRun).toMatchObject({
            status: "failed",
            currentStepKey: "always-fails",
            errorMessage: "QUEUE_STEP_FAILED",
            retryCount: 1,
        });

        expect(steps).toHaveLength(1);
        expect(steps[0]).toMatchObject({
            stepKey: "always-fails",
            status: "failed",
            attemptCount: 2,
        });
    });
});