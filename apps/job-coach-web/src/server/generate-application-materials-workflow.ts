import { runWorkflow, type WorkflowRunRepository } from "@coach/core";

export function createGenerateApplicationMaterialsWorkflow(dependencies: {
  workflowRunRepository: WorkflowRunRepository;
  createTailoredResume(input: {
    resumeProfileId: string;
    resumeVersionId: string;
    jobId: string;
  }): Promise<{ id: string }>;
  createCoverLetterDraft(input: {
    resumeProfileId: string;
    jobId: string;
  }): Promise<{ id: string }>;
  exportApplicationPacket(input: {
    resumeProfileId: string;
    resumeVersionId: string;
    coverLetterDraftId: string;
    format: "pdf" | "docx";
  }): Promise<unknown>;
}) {
  return {
    async start(input: {
      resumeProfileId: string;
      resumeVersionId: string;
      jobId: string;
      format?: "pdf" | "docx";
    }) {
      const workflowRun = await dependencies.workflowRunRepository.createWorkflowRun({
        workflowType: "generate-application-materials",
        input: {
          resumeProfileId: input.resumeProfileId,
          resumeVersionId: input.resumeVersionId,
          jobId: input.jobId,
          format: input.format ?? "pdf",
        },
        status: "queued",
      });

      let tailoredResumeId: string | undefined;
      let coverLetterDraftId: string | undefined;

      await runWorkflow({
        workflowRunRepository: dependencies.workflowRunRepository,
        workflowRunId: workflowRun.id,
        steps: [
          {
            stepKey: "generate-tailored-resume",
            run: async () => {
              const tailoredResume = await dependencies.createTailoredResume({
                resumeProfileId: input.resumeProfileId,
                resumeVersionId: input.resumeVersionId,
                jobId: input.jobId,
              });

              tailoredResumeId = tailoredResume.id;
            },
          },
          {
            stepKey: "generate-cover-letter",
            run: async () => {
              const coverLetter = await dependencies.createCoverLetterDraft({
                resumeProfileId: input.resumeProfileId,
                jobId: input.jobId,
              });

              coverLetterDraftId = coverLetter.id;
            },
          },
          {
            stepKey: "export-application-packet",
            run: async () => {
              if (!coverLetterDraftId) {
                throw new Error("MISSING_COVER_LETTER_DRAFT_ID");
              }

              await dependencies.exportApplicationPacket({
                resumeProfileId: input.resumeProfileId,
                resumeVersionId: tailoredResumeId ?? input.resumeVersionId,
                coverLetterDraftId,
                format: input.format ?? "pdf",
              });
            },
          },
        ],
      });

      return dependencies.workflowRunRepository.getWorkflowRunById(workflowRun.id);
    },
  };
}
