import type { WorkflowRunRepository } from "./types";

export type WorkflowStepDefinition = {
  stepKey: string;
  run(input: { workflowRunId: string; attemptCount: number }): Promise<void>;
};

export async function runWorkflow(input: {
  workflowRunRepository: WorkflowRunRepository;
  workflowRunId: string;
  steps: WorkflowStepDefinition[];
  maxAttemptsPerStep?: number;
}) {
  const maxAttemptsPerStep = input.maxAttemptsPerStep ?? 3;

  await input.workflowRunRepository.updateWorkflowRun({
    workflowRunId: input.workflowRunId,
    status: "running",
    startedAt: new Date(),
  });

  for (const definition of input.steps) {
    const createdStep = await input.workflowRunRepository.createWorkflowStep({
      workflowRunId: input.workflowRunId,
      stepKey: definition.stepKey,
      status: "pending",
    });

    await input.workflowRunRepository.updateWorkflowRun({
      workflowRunId: input.workflowRunId,
      currentStepKey: definition.stepKey,
    });

    let attemptCount = 0;
    let lastError: unknown = undefined;

    while (attemptCount < maxAttemptsPerStep) {
      attemptCount += 1;

      await input.workflowRunRepository.updateWorkflowStep({
        workflowStepId: createdStep.id,
        status: "running",
        attemptCount,
        errorMessage: undefined,
        startedAt: new Date(),
      });

      try {
        await definition.run({
          workflowRunId: input.workflowRunId,
          attemptCount,
        });

        await input.workflowRunRepository.updateWorkflowStep({
          workflowStepId: createdStep.id,
          status: "succeeded",
          attemptCount,
          completedAt: new Date(),
          errorMessage: undefined,
        });

        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;

        const message = error instanceof Error ? error.message : "Unknown workflow step error";

        await input.workflowRunRepository.updateWorkflowStep({
          workflowStepId: createdStep.id,
          status: attemptCount >= maxAttemptsPerStep ? "failed" : "pending",
          attemptCount,
          errorMessage: message,
          completedAt: attemptCount >= maxAttemptsPerStep ? new Date() : undefined,
        });
      }
    }

    if (lastError) {
      const message =
        lastError instanceof Error ? lastError.message : "Unknown workflow step error";

      const existingRun = await input.workflowRunRepository.getWorkflowRunById(input.workflowRunId);

      await input.workflowRunRepository.updateWorkflowRun({
        workflowRunId: input.workflowRunId,
        status: "failed",
        currentStepKey: definition.stepKey,
        errorMessage: message,
        retryCount: (existingRun?.retryCount ?? 0) + 1,
        completedAt: new Date(),
      });

      throw lastError;
    }
  }

  await input.workflowRunRepository.updateWorkflowRun({
    workflowRunId: input.workflowRunId,
    status: "succeeded",
    currentStepKey: undefined,
    errorMessage: undefined,
    completedAt: new Date(),
  });
}
