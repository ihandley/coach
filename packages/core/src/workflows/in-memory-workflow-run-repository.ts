import type {
  CreateWorkflowRunInput,
  CreateWorkflowStepInput,
  UpdateWorkflowRunInput,
  UpdateWorkflowStepInput,
  WorkflowRun,
  WorkflowRunRepository,
  WorkflowStep,
} from "./types";

export function createInMemoryWorkflowRunRepository(): WorkflowRunRepository {
  const workflowRuns = new Map<string, WorkflowRun>();
  const workflowSteps = new Map<string, WorkflowStep>();

  return {
    async createWorkflowRun(input: CreateWorkflowRunInput) {
      const workflowRun: WorkflowRun = {
        id: crypto.randomUUID(),
        workflowType: input.workflowType,
        status: input.status ?? "queued",
        input: input.input,
        currentStepKey: input.currentStepKey,
        errorMessage: input.errorMessage,
        retryCount: input.retryCount ?? 0,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
        createdAt: new Date(),
      };

      workflowRuns.set(workflowRun.id, workflowRun);

      return workflowRun;
    },

    async updateWorkflowRun(input: UpdateWorkflowRunInput) {
      const existing = workflowRuns.get(input.workflowRunId);

      if (!existing) {
        return null;
      }

      const updated: WorkflowRun = {
        ...existing,
        status: input.status ?? existing.status,
        currentStepKey:
          input.currentStepKey === undefined ? existing.currentStepKey : input.currentStepKey,
        errorMessage: input.errorMessage === undefined ? existing.errorMessage : input.errorMessage,
        retryCount: input.retryCount ?? existing.retryCount,
        startedAt: input.startedAt === undefined ? existing.startedAt : input.startedAt,
        completedAt: input.completedAt === undefined ? existing.completedAt : input.completedAt,
      };

      workflowRuns.set(updated.id, updated);

      return updated;
    },

    async getWorkflowRunById(workflowRunId: string) {
      return workflowRuns.get(workflowRunId) ?? null;
    },

    async listWorkflowRuns() {
      return Array.from(workflowRuns.values()).sort(
        (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
      );
    },

    async createWorkflowStep(input: CreateWorkflowStepInput) {
      const workflowStep: WorkflowStep = {
        id: crypto.randomUUID(),
        workflowRunId: input.workflowRunId,
        stepKey: input.stepKey,
        status: input.status ?? "pending",
        attemptCount: input.attemptCount ?? 0,
        errorMessage: input.errorMessage,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
        createdAt: new Date(),
      };

      workflowSteps.set(workflowStep.id, workflowStep);

      return workflowStep;
    },

    async updateWorkflowStep(input: UpdateWorkflowStepInput) {
      const existing = workflowSteps.get(input.workflowStepId);

      if (!existing) {
        return null;
      }

      const updated: WorkflowStep = {
        ...existing,
        status: input.status ?? existing.status,
        attemptCount: input.attemptCount ?? existing.attemptCount,
        errorMessage: input.errorMessage === undefined ? existing.errorMessage : input.errorMessage,
        startedAt: input.startedAt === undefined ? existing.startedAt : input.startedAt,
        completedAt: input.completedAt === undefined ? existing.completedAt : input.completedAt,
      };

      workflowSteps.set(updated.id, updated);

      return updated;
    },

    async listWorkflowStepsByRunId(workflowRunId: string) {
      return Array.from(workflowSteps.values())
        .filter((step) => step.workflowRunId === workflowRunId)
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    },
  };
}
