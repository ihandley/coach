export const WORKFLOW_RUN_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
] as const;

export type WorkflowRunStatus = (typeof WORKFLOW_RUN_STATUSES)[number];

export const WORKFLOW_STEP_STATUSES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "skipped",
] as const;

export type WorkflowStepStatus = (typeof WORKFLOW_STEP_STATUSES)[number];

export interface WorkflowRun {
  id: string;
  workflowType: string;
  status: WorkflowRunStatus;
  input: Record<string, unknown>;
  currentStepKey?: string;
  errorMessage?: string;
  retryCount: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface WorkflowStep {
  id: string;
  workflowRunId: string;
  stepKey: string;
  status: WorkflowStepStatus;
  attemptCount: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface CreateWorkflowRunInput {
  workflowType: string;
  input: Record<string, unknown>;
  status?: WorkflowRunStatus;
  currentStepKey?: string;
  errorMessage?: string;
  retryCount?: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface UpdateWorkflowRunInput {
  workflowRunId: string;
  status?: WorkflowRunStatus;
  currentStepKey?: string;
  errorMessage?: string;
  retryCount?: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CreateWorkflowStepInput {
  workflowRunId: string;
  stepKey: string;
  status?: WorkflowStepStatus;
  attemptCount?: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface UpdateWorkflowStepInput {
  workflowStepId: string;
  status?: WorkflowStepStatus;
  attemptCount?: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkflowRunRepository {
  createWorkflowRun(input: CreateWorkflowRunInput): Promise<WorkflowRun>;
  updateWorkflowRun(input: UpdateWorkflowRunInput): Promise<WorkflowRun | null>;
  getWorkflowRunById(workflowRunId: string): Promise<WorkflowRun | null>;
  listWorkflowRuns(): Promise<WorkflowRun[]>;
  createWorkflowStep(input: CreateWorkflowStepInput): Promise<WorkflowStep>;
  updateWorkflowStep(input: UpdateWorkflowStepInput): Promise<WorkflowStep | null>;
  listWorkflowStepsByRunId(workflowRunId: string): Promise<WorkflowStep[]>;
}
