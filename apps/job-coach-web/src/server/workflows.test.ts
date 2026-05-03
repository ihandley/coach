import { describe, expect, it, vi } from "vitest";
import { createInMemoryWorkflowRunRepository } from "@coach/core";
import { createWorkflowsServer } from "./workflows";

describe("createWorkflowsServer", () => {
  it("runs import-job-and-score-fit workflow and stores run history", async () => {
    const workflowRunRepository = createInMemoryWorkflowRunRepository();

    const importJobFromUrl = vi.fn().mockResolvedValue({
      id: "job-123",
    });

    const scoreJobFit = vi.fn().mockResolvedValue({
      score: 82,
    });

    const server = createWorkflowsServer({
      workflowRunRepository,
      importJobFromUrl,
      scoreJobFit,
    });

    const result = await server.startImportJobAndScoreFitWorkflow({
      sourceUrl: "https://example.com/jobs/123",
      resumeProfileId: "resume-profile-1",
    });

    expect(importJobFromUrl).toHaveBeenCalledWith({
      sourceUrl: "https://example.com/jobs/123",
    });

    expect(scoreJobFit).toHaveBeenCalledWith({
      jobId: "job-123",
      resumeProfileId: "resume-profile-1",
    });

    expect(result).toMatchObject({
      id: expect.any(String),
      workflowType: "import-job-and-score-fit",
      status: "succeeded",
      input: {
        sourceUrl: "https://example.com/jobs/123",
        resumeProfileId: "resume-profile-1",
      },
    });

    const workflowRunId = result?.id;

    expect(workflowRunId).toBeDefined();

    const workflowStatus = await server.getWorkflowRun({
      workflowRunId: workflowRunId!,
    });

    expect(workflowStatus).toMatchObject({
      workflowRun: {
        id: workflowRunId,
        status: "succeeded",
      },
    });

    expect(workflowStatus?.workflowSteps).toHaveLength(2);
    expect(workflowStatus?.workflowSteps[0]).toMatchObject({
      stepKey: "import-job",
      status: "succeeded",
      attemptCount: 1,
    });
    expect(workflowStatus?.workflowSteps[1]).toMatchObject({
      stepKey: "score-fit",
      status: "succeeded",
      attemptCount: 1,
    });

    const runs = await server.listWorkflowRuns();

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      id: workflowRunId,
      workflowType: "import-job-and-score-fit",
      status: "succeeded",
    });
  });

  it("stores failure details when a workflow step fails", async () => {
    const workflowRunRepository = createInMemoryWorkflowRunRepository();

    const importJobFromUrl = vi.fn().mockResolvedValue({
      id: "job-123",
    });

    const scoreJobFit = vi.fn().mockRejectedValue(new Error("SCORING_UNAVAILABLE"));

    const server = createWorkflowsServer({
      workflowRunRepository,
      importJobFromUrl,
      scoreJobFit,
    });

    await expect(
      server.startImportJobAndScoreFitWorkflow({
        sourceUrl: "https://example.com/jobs/123",
        resumeProfileId: "resume-profile-1",
      }),
    ).rejects.toThrow("SCORING_UNAVAILABLE");

    const runs = await server.listWorkflowRuns();

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      workflowType: "import-job-and-score-fit",
      status: "failed",
      currentStepKey: "score-fit",
      errorMessage: "SCORING_UNAVAILABLE",
      retryCount: 1,
    });

    const workflowStatus = await server.getWorkflowRun({
      workflowRunId: runs[0].id,
    });

    expect(workflowStatus?.workflowSteps).toHaveLength(2);
    expect(workflowStatus?.workflowSteps[0]).toMatchObject({
      stepKey: "import-job",
      status: "succeeded",
    });
    expect(workflowStatus?.workflowSteps[1]).toMatchObject({
      stepKey: "score-fit",
      status: "failed",
      attemptCount: 3,
      errorMessage: "SCORING_UNAVAILABLE",
    });
  });

  it("runs generate-application-materials workflow", async () => {
    const workflowRunRepository = createInMemoryWorkflowRunRepository();

    const importJobFromUrl = vi.fn();
    const scoreJobFit = vi.fn();
    const createTailoredResume = vi.fn().mockResolvedValue({
      id: "tailored-resume-1",
    });
    const createCoverLetterDraft = vi.fn().mockResolvedValue({
      id: "cover-letter-1",
    });
    const exportApplicationPacket = vi.fn().mockResolvedValue({
      fileName: "application-packet-rp1-tailored-resume-1-cover-letter-1.pdf",
    });

    const server = createWorkflowsServer({
      workflowRunRepository,
      importJobFromUrl,
      scoreJobFit,
      createTailoredResume,
      createCoverLetterDraft,
      exportApplicationPacket,
    });

    const result = await server.startGenerateApplicationMaterialsWorkflow({
      resumeProfileId: "rp1",
      resumeVersionId: "rv1",
      jobId: "job1",
      format: "pdf",
    });

    expect(createTailoredResume).toHaveBeenCalledWith({
      resumeProfileId: "rp1",
      resumeVersionId: "rv1",
      jobId: "job1",
    });

    expect(createCoverLetterDraft).toHaveBeenCalledWith({
      resumeProfileId: "rp1",
      jobId: "job1",
    });

    expect(exportApplicationPacket).toHaveBeenCalledWith({
      resumeProfileId: "rp1",
      resumeVersionId: "tailored-resume-1",
      coverLetterDraftId: "cover-letter-1",
      format: "pdf",
    });

    expect(result).toMatchObject({
      id: expect.any(String),
      workflowType: "generate-application-materials",
      status: "succeeded",
    });

    const steps = await workflowRunRepository.listWorkflowStepsByRunId(result!.id);

    expect(steps).toHaveLength(3);
    expect(steps[0]).toMatchObject({
      stepKey: "generate-tailored-resume",
      status: "succeeded",
    });
    expect(steps[1]).toMatchObject({
      stepKey: "generate-cover-letter",
      status: "succeeded",
    });
    expect(steps[2]).toMatchObject({
      stepKey: "export-application-packet",
      status: "succeeded",
    });
  });
});
