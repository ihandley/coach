import { createWorkflowQueue, type WorkflowRunRepository } from "@coach/core";
import { createGenerateApplicationMaterialsWorkflow } from "./generate-application-materials-workflow";

export function createWorkflowsServer(dependencies: {
  workflowRunRepository: WorkflowRunRepository;
  importJobFromUrl(input: { sourceUrl: string }): Promise<{ id: string }>;
  scoreJobFit(input: { jobId: string; resumeProfileId: string }): Promise<unknown>;
  createTailoredResume?(input: {
    resumeProfileId: string;
    resumeVersionId: string;
    jobId: string;
  }): Promise<{ id: string }>;
  createCoverLetterDraft?(input: {
    resumeProfileId: string;
    jobId: string;
  }): Promise<{ id: string }>;
  exportApplicationPacket?(input: {
    resumeProfileId: string;
    resumeVersionId: string;
    coverLetterDraftId: string;
    format: "pdf" | "docx";
  }): Promise<unknown>;
}) {
  const workflowQueue = createWorkflowQueue({
    workflowRunRepository: dependencies.workflowRunRepository,
  });

  return {
    async startImportJobAndScoreFitWorkflow(input: { sourceUrl: string; resumeProfileId: string }) {
      const workflowRun = await dependencies.workflowRunRepository.createWorkflowRun({
        workflowType: "import-job-and-score-fit",
        input: {
          sourceUrl: input.sourceUrl,
          resumeProfileId: input.resumeProfileId,
        },
        status: "queued",
      });

      let importedJobId: string | undefined;

      await workflowQueue.enqueue({
        workflowRunId: workflowRun.id,
        steps: [
          {
            stepKey: "import-job",
            run: async () => {
              const job = await dependencies.importJobFromUrl({
                sourceUrl: input.sourceUrl,
              });

              importedJobId = job.id;
            },
          },
          {
            stepKey: "score-fit",
            run: async () => {
              if (!importedJobId) {
                throw new Error("MISSING_IMPORTED_JOB_ID");
              }

              await dependencies.scoreJobFit({
                jobId: importedJobId,
                resumeProfileId: input.resumeProfileId,
              });
            },
          },
        ],
      });

      return dependencies.workflowRunRepository.getWorkflowRunById(workflowRun.id);
    },

    async startGenerateApplicationMaterialsWorkflow(input: {
      resumeProfileId: string;
      resumeVersionId: string;
      jobId: string;
      format?: "pdf" | "docx";
    }) {
      if (
        !dependencies.createTailoredResume ||
        !dependencies.createCoverLetterDraft ||
        !dependencies.exportApplicationPacket
      ) {
        throw new Error("APPLICATION_MATERIALS_WORKFLOW_NOT_CONFIGURED");
      }

      const workflow = createGenerateApplicationMaterialsWorkflow({
        workflowRunRepository: dependencies.workflowRunRepository,
        createTailoredResume: dependencies.createTailoredResume,
        createCoverLetterDraft: dependencies.createCoverLetterDraft,
        exportApplicationPacket: dependencies.exportApplicationPacket,
      });

      return workflow.start(input);
    },

    async getWorkflowRun(input: { workflowRunId: string }) {
      const workflowRun = await dependencies.workflowRunRepository.getWorkflowRunById(
        input.workflowRunId,
      );

      if (!workflowRun) {
        return null;
      }

      const workflowSteps = await dependencies.workflowRunRepository.listWorkflowStepsByRunId(
        workflowRun.id,
      );

      return {
        workflowRun,
        workflowSteps,
      };
    },

    async listWorkflowRuns() {
      return dependencies.workflowRunRepository.listWorkflowRuns();
    },
  };
}
