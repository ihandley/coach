import type { WorkflowRunRepository } from "./types.ts";
import { runWorkflow, type WorkflowStepDefinition } from "./run-workflow.ts";

export interface WorkflowQueueJob {
    workflowRunId: string;
    steps: WorkflowStepDefinition[];
    maxAttemptsPerStep?: number;
}

export function createWorkflowQueue(dependencies: {
    workflowRunRepository: WorkflowRunRepository;
}) {
    const jobs: WorkflowQueueJob[] = [];
    let isProcessing = false;

    async function processNext() {
        if (isProcessing) {
            return;
        }

        const nextJob = jobs.shift();

        if (!nextJob) {
            return;
        }

        isProcessing = true;

        try {
            await runWorkflow({
                workflowRunRepository: dependencies.workflowRunRepository,
                workflowRunId: nextJob.workflowRunId,
                steps: nextJob.steps,
                maxAttemptsPerStep: nextJob.maxAttemptsPerStep,
            });
        } finally {
            isProcessing = false;

            if (jobs.length > 0) {
                await processNext();
            }
        }
    }

    return {
        async enqueue(job: WorkflowQueueJob) {
            jobs.push(job);

            await processNext();
        },

        getPendingCount() {
            return jobs.length;
        },

        isProcessing() {
            return isProcessing;
        },
    };
}