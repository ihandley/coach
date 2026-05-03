import { afterEach, describe, expect, it, vi } from "vitest";

const getWorkflowRunMock = vi.fn();

vi.mock("../../../../server/workflows-server", () => {
  return {
    workflowsServer: {
      getWorkflowRun: getWorkflowRunMock,
    },
  };
});

describe("GET /api/workflows/[workflowRunId]", () => {
  afterEach(() => {
    getWorkflowRunMock.mockReset();
  });

  it("returns workflow run details", async () => {
    const { GET } = await import("./route");

    getWorkflowRunMock.mockResolvedValue({
      workflowRun: {
        id: "run-1",
        workflowType: "import-job-and-score-fit",
        status: "succeeded",
      },
      workflowSteps: [
        {
          id: "step-1",
          workflowRunId: "run-1",
          stepKey: "import-job",
          status: "succeeded",
          attemptCount: 1,
        },
      ],
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ workflowRunId: "run-1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      workflowRun: {
        id: "run-1",
        workflowType: "import-job-and-score-fit",
        status: "succeeded",
      },
      workflowSteps: [
        {
          id: "step-1",
          workflowRunId: "run-1",
          stepKey: "import-job",
          status: "succeeded",
          attemptCount: 1,
        },
      ],
    });

    expect(getWorkflowRunMock).toHaveBeenCalledWith({
      workflowRunId: "run-1",
    });
  });

  it("returns 404 when workflow run is missing", async () => {
    const { GET } = await import("./route");

    getWorkflowRunMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ workflowRunId: "missing-run" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "WORKFLOW_RUN_NOT_FOUND",
    });
  });
});
