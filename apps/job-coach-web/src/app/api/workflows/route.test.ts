import { afterEach, describe, expect, it, vi } from "vitest";

const listWorkflowRunsMock = vi.fn();
const startImportJobAndScoreFitWorkflowMock = vi.fn();
const startGenerateApplicationMaterialsWorkflowMock = vi.fn();

vi.mock("../../../server/workflows-server", () => {
    return {
        workflowsServer: {
            listWorkflowRuns: listWorkflowRunsMock,
            startImportJobAndScoreFitWorkflow:
                startImportJobAndScoreFitWorkflowMock,
            startGenerateApplicationMaterialsWorkflow:
                startGenerateApplicationMaterialsWorkflowMock,
        },
    };
});

describe("GET /api/workflows", () => {
    afterEach(() => {
        listWorkflowRunsMock.mockReset();
        startImportJobAndScoreFitWorkflowMock.mockReset();
        startGenerateApplicationMaterialsWorkflowMock.mockReset();
    });

    it("returns workflow runs", async () => {
        const { GET } = await import("./route");

        listWorkflowRunsMock.mockResolvedValue([
            {
                id: "run-1",
                workflowType: "import-job-and-score-fit",
                status: "succeeded",
            },
        ]);

        const response = await GET();

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([
            {
                id: "run-1",
                workflowType: "import-job-and-score-fit",
                status: "succeeded",
            },
        ]);
    });
});

describe("POST /api/workflows", () => {
    afterEach(() => {
        listWorkflowRunsMock.mockReset();
        startImportJobAndScoreFitWorkflowMock.mockReset();
        startGenerateApplicationMaterialsWorkflowMock.mockReset();
    });

    it("starts import-job-and-score-fit workflow", async () => {
        const { POST } = await import("./route");

        startImportJobAndScoreFitWorkflowMock.mockResolvedValue({
            id: "run-1",
            workflowType: "import-job-and-score-fit",
            status: "succeeded",
        });

        const response = await POST(
            new Request("http://localhost/api/workflows", {
                method: "POST",
                body: JSON.stringify({
                    workflowType: "import-job-and-score-fit",
                    sourceUrl: "https://example.com/jobs/123",
                    resumeProfileId: "resume-profile-1",
                }),
                headers: {
                    "content-type": "application/json",
                },
            }),
        );

        expect(response.status).toBe(201);
        expect(await response.json()).toEqual({
            id: "run-1",
            workflowType: "import-job-and-score-fit",
            status: "succeeded",
        });

        expect(startImportJobAndScoreFitWorkflowMock).toHaveBeenCalledWith({
            sourceUrl: "https://example.com/jobs/123",
            resumeProfileId: "resume-profile-1",
        });
    });

    it("starts generate-application-materials workflow", async () => {
        const { POST } = await import("./route");

        startGenerateApplicationMaterialsWorkflowMock.mockResolvedValue({
            id: "run-2",
            workflowType: "generate-application-materials",
            status: "succeeded",
        });

        const response = await POST(
            new Request("http://localhost/api/workflows", {
                method: "POST",
                body: JSON.stringify({
                    workflowType: "generate-application-materials",
                    resumeProfileId: "rp1",
                    resumeVersionId: "rv1",
                    jobId: "job1",
                    format: "pdf",
                }),
                headers: {
                    "content-type": "application/json",
                },
            }),
        );

        expect(response.status).toBe(201);
        expect(await response.json()).toEqual({
            id: "run-2",
            workflowType: "generate-application-materials",
            status: "succeeded",
        });

        expect(
            startGenerateApplicationMaterialsWorkflowMock,
        ).toHaveBeenCalledWith({
            resumeProfileId: "rp1",
            resumeVersionId: "rv1",
            jobId: "job1",
            format: "pdf",
        });
    });

    it("returns 400 for invalid input", async () => {
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost/api/workflows", {
                method: "POST",
                body: JSON.stringify({
                    workflowType: "import-job-and-score-fit",
                    sourceUrl: "https://example.com/jobs/123",
                }),
                headers: {
                    "content-type": "application/json",
                },
            }),
        );

        expect(response.status).toBe(400);
        expect(startImportJobAndScoreFitWorkflowMock).not.toHaveBeenCalled();
        expect(
            startGenerateApplicationMaterialsWorkflowMock,
        ).not.toHaveBeenCalled();
    });

    it("returns 500 when workflow execution fails", async () => {
        const { POST } = await import("./route");

        startImportJobAndScoreFitWorkflowMock.mockRejectedValue(
            new Error("SCORING_UNAVAILABLE"),
        );

        const response = await POST(
            new Request("http://localhost/api/workflows", {
                method: "POST",
                body: JSON.stringify({
                    workflowType: "import-job-and-score-fit",
                    sourceUrl: "https://example.com/jobs/123",
                    resumeProfileId: "resume-profile-1",
                }),
                headers: {
                    "content-type": "application/json",
                },
            }),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "SCORING_UNAVAILABLE",
        });
    });
});