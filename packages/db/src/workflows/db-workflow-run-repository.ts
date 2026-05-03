import type {
  CreateWorkflowRunInput,
  CreateWorkflowStepInput,
  UpdateWorkflowRunInput,
  UpdateWorkflowStepInput,
  WorkflowRun,
  WorkflowRunRepository,
  WorkflowStep,
} from "@coach/core";

type WorkflowRunRow = {
  id: string;
  workflow_type: string;
  status: WorkflowRun["status"];
  input: Record<string, unknown>;
  current_step_key: string | null;
  error_message: string | null;
  retry_count: number;
  started_at: string | Date | null;
  completed_at: string | Date | null;
  created_at: string | Date;
};

type WorkflowStepRow = {
  id: string;
  workflow_run_id: string;
  step_key: string;
  status: WorkflowStep["status"];
  attempt_count: number;
  error_message: string | null;
  started_at: string | Date | null;
  completed_at: string | Date | null;
  created_at: string | Date;
};

function mapWorkflowRun(row: WorkflowRunRow): WorkflowRun {
  return {
    id: row.id,
    workflowType: row.workflow_type,
    status: row.status,
    input: row.input,
    currentStepKey: row.current_step_key ?? undefined,
    errorMessage: row.error_message ?? undefined,
    retryCount: row.retry_count,
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapWorkflowStep(row: WorkflowStepRow): WorkflowStep {
  return {
    id: row.id,
    workflowRunId: row.workflow_run_id,
    stepKey: row.step_key,
    status: row.status,
    attemptCount: row.attempt_count,
    errorMessage: row.error_message ?? undefined,
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

export function createDbWorkflowRunRepository({ db }: { db: any }): WorkflowRunRepository {
  return {
    async createWorkflowRun(input: CreateWorkflowRunInput) {
      const row = await db
        .insertInto("workflow_runs")
        .values({
          workflow_type: input.workflowType,
          status: input.status ?? "queued",
          input: input.input,
          current_step_key: input.currentStepKey ?? null,
          error_message: input.errorMessage ?? null,
          retry_count: input.retryCount ?? 0,
          started_at: input.startedAt ?? null,
          completed_at: input.completedAt ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return mapWorkflowRun(row);
    },

    async updateWorkflowRun(input: UpdateWorkflowRunInput) {
      const row = await db
        .updateTable("workflow_runs")
        .set({
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.currentStepKey !== undefined
            ? { current_step_key: input.currentStepKey ?? null }
            : {}),
          ...(input.errorMessage !== undefined
            ? { error_message: input.errorMessage ?? null }
            : {}),
          ...(input.retryCount !== undefined ? { retry_count: input.retryCount } : {}),
          ...(input.startedAt !== undefined ? { started_at: input.startedAt ?? null } : {}),
          ...(input.completedAt !== undefined ? { completed_at: input.completedAt ?? null } : {}),
        })
        .where("id", "=", input.workflowRunId)
        .returningAll()
        .executeTakeFirst();

      return row ? mapWorkflowRun(row) : null;
    },

    async getWorkflowRunById(workflowRunId: string) {
      const row = await db
        .selectFrom("workflow_runs")
        .selectAll()
        .where("id", "=", workflowRunId)
        .executeTakeFirst();

      return row ? mapWorkflowRun(row) : null;
    },

    async listWorkflowRuns() {
      const rows = await db
        .selectFrom("workflow_runs")
        .selectAll()
        .orderBy("created_at", "asc")
        .execute();

      return rows.map(mapWorkflowRun);
    },

    async createWorkflowStep(input: CreateWorkflowStepInput) {
      const row = await db
        .insertInto("workflow_steps")
        .values({
          workflow_run_id: input.workflowRunId,
          step_key: input.stepKey,
          status: input.status ?? "pending",
          attempt_count: input.attemptCount ?? 0,
          error_message: input.errorMessage ?? null,
          started_at: input.startedAt ?? null,
          completed_at: input.completedAt ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return mapWorkflowStep(row);
    },

    async updateWorkflowStep(input: UpdateWorkflowStepInput) {
      const row = await db
        .updateTable("workflow_steps")
        .set({
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.attemptCount !== undefined ? { attempt_count: input.attemptCount } : {}),
          ...(input.errorMessage !== undefined
            ? { error_message: input.errorMessage ?? null }
            : {}),
          ...(input.startedAt !== undefined ? { started_at: input.startedAt ?? null } : {}),
          ...(input.completedAt !== undefined ? { completed_at: input.completedAt ?? null } : {}),
        })
        .where("id", "=", input.workflowStepId)
        .returningAll()
        .executeTakeFirst();

      return row ? mapWorkflowStep(row) : null;
    },

    async listWorkflowStepsByRunId(workflowRunId: string) {
      const rows = await db
        .selectFrom("workflow_steps")
        .selectAll()
        .where("workflow_run_id", "=", workflowRunId)
        .orderBy("created_at", "asc")
        .execute();

      return rows.map(mapWorkflowStep);
    },
  };
}
