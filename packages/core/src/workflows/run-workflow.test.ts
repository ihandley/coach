import { describe, expect, it, vi } from "vitest";
import { createInMemoryWorkflowRunRepository } from "./in-memory-workflow-run-repository.ts";
import { runWorkflow } from "./run-workflow.ts";

describe("runWorkflow", () => {
    it("runs all workflow steps and marks the run as succeeded", async () => {
        const workflowRunRepository = createInMemoryWorkflowRunRepository();

        const workflowRun = await workflowRunRepository.createWorkflowRun({
            workflowType: "import-job-and-score-fit",
            input: {
                jobUrl: "https://example.com/jobs/1",
            },
        });

        const firstStep = vi.fn().mockResolvedValue(undefined);
        const secondStep = vi.fn().mockResolvedValue(undefined);

        await runWorkflow({
            workflowRunRepository,
            workflowRunId: workflowRun.id,
            steps: [
                {
                    stepKey: "import-job",
                    run: firstStep,
                },
                {
                    stepKey: "score-fit",
                    run: secondStep,
                },
            ],
        });

        expect(firstStep).toHaveBeenCalledWith({
            workflowRunId: workflowRun.id,
            attemptCount: 1,
        });
        expect(secondStep).toHaveBeenCalledWith({
            workflowRunId: workflowRun.id,
            attemptCount: 1,
        });

        const updatedRun = await workflowRunRepository.getWorkflowRunById(
            workflowRun.id,
        );
        const steps = await workflowRunRepository.listWorkflowStepsByRunId(
            workflowRun.id,
        );

        expect(updatedRun).toMatchObject({
            id: workflowRun.id,
            status: "succeeded",
            errorMessage: undefined,
            completedAt: expect.any(Date),
        });

        expect(steps).toHaveLength(2);
        expect(steps[0]).toMatchObject({
            stepKey: "import-job",
            status: "succeeded",
            attemptCount: 1,
        });
        expect(steps[1]).toMatchObject({
            stepKey: "score-fit",
            status: "succeeded",
            attemptCount: 1,
        });
    });

    it("retries a failing step and succeeds when a later attempt works", async () => {
        const workflowRunRepository = createInMemoryWorkflowRunRepository();

        const workflowRun = await workflowRunRepository.createWorkflowRun({
            workflowType: "generate-tailored-resume",
            input: {
                resumeProfileId: "rp1",
                resumeVersionId: "rv1",
            },
        });

        const flakyStep = vi
            .fn()
            .mockRejectedValueOnce(new Error("temporary failure"))
            .mockResolvedValueOnce(undefined);

        await runWorkflow({
            workflowRunRepository,
            workflowRunId: workflowRun.id,
            steps: [
                {
                    stepKey: "generate-tailored-resume",
                    run: flakyStep,
                },
            ],
            maxAttemptsPerStep: 2,
        });

        expect(flakyStep).toHaveBeenCalledTimes(2);

        const updatedRun = await workflowRunRepository.getWorkflowRunById(
            workflowRun.id,
        );
        const steps = await workflowRunRepository.listWorkflowStepsByRunId(
            workflowRun.id,
        );

        expect(updatedRun).toMatchObject({
            id: workflowRun.id,
            status: "succeeded",
        });

        expect(steps).toHaveLength(1);
        expect(steps[0]).toMatchObject({
            stepKey: "generate-tailored-resume",
            status: "succeeded",
            attemptCount: 2,
        });
    });

    it("marks the run as failed when retries are exhausted", async () => {
        const workflowRunRepository = createInMemoryWorkflowRunRepository();

        const workflowRun = await workflowRunRepository.createWorkflowRun({
            workflowType: "generate-packet",
            input: {
                resumeProfileId: "rp1",
                resumeVersionId: "rv1",
                coverLetterDraftId: "cl1",
            },
        });

        const failingStep = vi
            .fn()
            .mockRejectedValue(new Error("permanent failure"));

        await expect(
            runWorkflow({
                workflowRunRepository,
                workflowRunId: workflowRun.id,
                steps: [
                    {
                        stepKey: "export-packet",
                        run: failingStep,
                    },
                ],
                maxAttemptsPerStep: 2,
            }),
        ).rejects.toThrow("permanent failure");

        expect(failingStep).toHaveBeenCalledTimes(2);

        const updatedRun = await workflowRunRepository.getWorkflowRunById(
            workflowRun.id,
        );
        const steps = await workflowRunRepository.listWorkflowStepsByRunId(
            workflowRun.id,
        );

        expect(updatedRun).toMatchObject({
            id: workflowRun.id,
            status: "failed",
            currentStepKey: "export-packet",
            errorMessage: "permanent failure",
            retryCount: 1,
            completedAt: expect.any(Date),
        });

        expect(steps).toHaveLength(1);
        expect(steps[0]).toMatchObject({
            stepKey: "export-packet",
            status: "failed",
            attemptCount: 2,
            errorMessage: "permanent failure",
        });
    });
});