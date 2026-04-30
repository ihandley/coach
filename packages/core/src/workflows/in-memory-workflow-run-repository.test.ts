import { describe, expect, it } from "vitest";
import { createInMemoryWorkflowRunRepository } from "./in-memory-workflow-run-repository";

describe("createInMemoryWorkflowRunRepository", () => {
    it("creates and updates workflow runs and steps", async () => {
        const repository = createInMemoryWorkflowRunRepository();

        const createdRun = await repository.createWorkflowRun({
            workflowType: "import-job-and-score-fit",
            input: {
                jobUrl: "https://example.com/job/1",
            },
        });

        expect(createdRun).toMatchObject({
            id: expect.any(String),
            workflowType: "import-job-and-score-fit",
            status: "queued",
            input: {
                jobUrl: "https://example.com/job/1",
            },
            retryCount: 0,
            createdAt: expect.any(Date),
        });

        const updatedRun = await repository.updateWorkflowRun({
            workflowRunId: createdRun.id,
            status: "running",
            currentStepKey: "import-job",
            startedAt: new Date("2026-04-22T22:00:00.000Z"),
        });

        expect(updatedRun).toMatchObject({
            id: createdRun.id,
            status: "running",
            currentStepKey: "import-job",
            startedAt: new Date("2026-04-22T22:00:00.000Z"),
        });

        const createdStep = await repository.createWorkflowStep({
            workflowRunId: createdRun.id,
            stepKey: "import-job",
        });

        expect(createdStep).toMatchObject({
            id: expect.any(String),
            workflowRunId: createdRun.id,
            stepKey: "import-job",
            status: "pending",
            attemptCount: 0,
            createdAt: expect.any(Date),
        });

        const updatedStep = await repository.updateWorkflowStep({
            workflowStepId: createdStep.id,
            status: "succeeded",
            attemptCount: 1,
            completedAt: new Date("2026-04-22T22:01:00.000Z"),
        });

        expect(updatedStep).toMatchObject({
            id: createdStep.id,
            status: "succeeded",
            attemptCount: 1,
            completedAt: new Date("2026-04-22T22:01:00.000Z"),
        });

        const fetchedRun = await repository.getWorkflowRunById(createdRun.id);

        expect(fetchedRun).toMatchObject({
            id: createdRun.id,
            status: "running",
            currentStepKey: "import-job",
        });

        const runs = await repository.listWorkflowRuns();
        const steps = await repository.listWorkflowStepsByRunId(createdRun.id);

        expect(runs).toHaveLength(1);
        expect(steps).toHaveLength(1);
        expect(steps[0]).toMatchObject({
            id: createdStep.id,
            stepKey: "import-job",
        });
    });
});