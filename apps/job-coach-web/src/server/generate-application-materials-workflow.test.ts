import { describe, expect, it, vi } from "vitest";
import { createInMemoryWorkflowRunRepository } from "@coach/core";
import { createGenerateApplicationMaterialsWorkflow } from "./generate-application-materials-workflow";

describe("createGenerateApplicationMaterialsWorkflow", () => {
    it("runs the happy path and records workflow history", async () => {
        const workflowRunRepository = createInMemoryWorkflowRunRepository();

        const createTailoredResume = vi.fn().mockResolvedValue({
            id: "tailored-resume-1",
        });

        const createCoverLetterDraft = vi.fn().mockResolvedValue({
            id: "cover-letter-1",
        });

        const exportApplicationPacket = vi.fn().mockResolvedValue({
            fileName: "application-packet-rp1-tailored-resume-1-cover-letter-1.pdf",
        });

        const workflow = createGenerateApplicationMaterialsWorkflow({
            workflowRunRepository,
            createTailoredResume,
            createCoverLetterDraft,
            exportApplicationPacket,
        });

        const result = await workflow.start({
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
            input: {
                resumeProfileId: "rp1",
                resumeVersionId: "rv1",
                jobId: "job1",
                format: "pdf",
            },
        });

        const steps = await workflowRunRepository.listWorkflowStepsByRunId(
            result!.id,
        );

        expect(steps).toHaveLength(3);
        expect(steps[0]).toMatchObject({
            stepKey: "generate-tailored-resume",
            status: "succeeded",
            attemptCount: 1,
        });
        expect(steps[1]).toMatchObject({
            stepKey: "generate-cover-letter",
            status: "succeeded",
            attemptCount: 1,
        });
        expect(steps[2]).toMatchObject({
            stepKey: "export-application-packet",
            status: "succeeded",
            attemptCount: 1,
        });
    });

    it("records a failed run when packet export fails", async () => {
        const workflowRunRepository = createInMemoryWorkflowRunRepository();

        const createTailoredResume = vi.fn().mockResolvedValue({
            id: "tailored-resume-1",
        });

        const createCoverLetterDraft = vi.fn().mockResolvedValue({
            id: "cover-letter-1",
        });

        const exportApplicationPacket = vi
            .fn()
            .mockRejectedValue(new Error("EXPORT_PACKET_FAILED"));

        const workflow = createGenerateApplicationMaterialsWorkflow({
            workflowRunRepository,
            createTailoredResume,
            createCoverLetterDraft,
            exportApplicationPacket,
        });

        await expect(
            workflow.start({
                resumeProfileId: "rp1",
                resumeVersionId: "rv1",
                jobId: "job1",
                format: "pdf",
            }),
        ).rejects.toThrow("EXPORT_PACKET_FAILED");

        const runs = await workflowRunRepository.listWorkflowRuns();

        expect(runs).toHaveLength(1);
        expect(runs[0]).toMatchObject({
            workflowType: "generate-application-materials",
            status: "failed",
            currentStepKey: "export-application-packet",
            errorMessage: "EXPORT_PACKET_FAILED",
            retryCount: 1,
        });

        const steps = await workflowRunRepository.listWorkflowStepsByRunId(
            runs[0].id,
        );

        expect(steps).toHaveLength(3);
        expect(steps[2]).toMatchObject({
            stepKey: "export-application-packet",
            status: "failed",
            attemptCount: 3,
            errorMessage: "EXPORT_PACKET_FAILED",
        });
    });
});