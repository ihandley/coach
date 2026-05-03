process.env.SUPABASE_URL = "http://127.0.0.1:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

import { beforeEach, describe, expect, it, vi } from "vitest";

const updateJobStatus = vi.fn();

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<object>("@coach/db");

  class MockDbJobRepository {
    updateJobStatus = updateJobStatus;
  }

  return {
    ...actual,
    DbJobRepository: MockDbJobRepository,
  };
});

beforeEach(() => {
  updateJobStatus.mockReset();
  vi.resetModules();
});

describe("POST /api/jobs/[jobId]/status", () => {
  it("updates the job status", async () => {
    updateJobStatus.mockResolvedValue({
      id: "job-123",
      status: "applied",
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/jobs/job-123/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "applied" }),
      }),
      { params: Promise.resolve({ jobId: "job-123" }) },
    );

    expect(updateJobStatus).toHaveBeenCalledWith({
      jobId: "job-123",
      status: "applied",
    });
    expect(response.status).toBe(200);
  });

  it("returns 400 for invalid input", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/jobs/job-123/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "" }),
      }),
      { params: Promise.resolve({ jobId: "job-123" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "INVALID_JOB_STATUS_INPUT",
    });
  });
});
