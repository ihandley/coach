process.env.SUPABASE_URL = "http://127.0.0.1:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

import { beforeEach, describe, expect, it, vi } from "vitest";

const listJobs = vi.fn();
const deleteJob = vi.fn();
const from = vi.fn();

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<object>("@coach/db");

  class MockDbJobRepository {
    listJobs = listJobs;
    deleteJob = deleteJob;
  }

  return {
    ...actual,
    createServerClient: vi.fn(() => ({
      from,
    })),
    DbJobRepository: MockDbJobRepository,
  };
});

beforeEach(() => {
  listJobs.mockReset();
  deleteJob.mockReset();
  from.mockReset();
  vi.resetModules();
});

describe("GET /api/jobs/[jobId]", () => {
  it("returns the matching job", async () => {
    listJobs.mockResolvedValue([
      {
        id: "job-123",
        company: "Acme",
        title: "Senior Software Engineer",
        sourceUrl: "https://example.com/jobs/123",
        sourceText: "Full job description",
        status: "saved",
        createdAt: "2026-04-20T10:00:00.000Z",
        updatedAt: "2026-04-23T10:00:00.000Z",
      },
    ]);

    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/jobs/job-123"), {
      params: Promise.resolve({ jobId: "job-123" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "job-123",
      company: "Acme",
      title: "Senior Software Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Full job description",
      status: "saved",
    });
  });

  it("returns 404 when the job does not exist", async () => {
    listJobs.mockResolvedValue([]);

    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/jobs/missing"), {
      params: Promise.resolve({ jobId: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: "JOB_NOT_FOUND",
    });
  });
});

describe("PATCH /api/jobs/[jobId]", () => {
  it("updates the company field", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "job-123",
        company: "Acme Labs",
      },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));

    from.mockReturnValue({ update });

    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost/api/jobs/job-123", {
        method: "PATCH",
        body: JSON.stringify({ company: " Acme Labs " }),
      }),
      {
        params: Promise.resolve({ jobId: "job-123" }),
      },
    );

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith("jobs");
    expect(update).toHaveBeenCalledWith({
      company: "Acme Labs",
      updated_at: expect.any(String),
    });
    expect(eq).toHaveBeenCalledWith("id", "job-123");
    expect(select).toHaveBeenCalledWith("id, company, title");
    await expect(response.json()).resolves.toEqual({
      id: "job-123",
      company: "Acme Labs",
    });
  });

  it("updates company and title fields together", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "job-123",
        company: "Acme Labs",
        title: "Principal Engineer",
      },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));

    from.mockReturnValue({ update });

    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost/api/jobs/job-123", {
        method: "PATCH",
        body: JSON.stringify({
          company: " Acme Labs ",
          title: " Principal Engineer ",
        }),
      }),
      {
        params: Promise.resolve({ jobId: "job-123" }),
      },
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      company: "Acme Labs",
      title: "Principal Engineer",
      updated_at: expect.any(String),
    });
    await expect(response.json()).resolves.toEqual({
      id: "job-123",
      company: "Acme Labs",
      title: "Principal Engineer",
    });
  });
});

describe("DELETE /api/jobs/[jobId]", () => {
  it("deletes the matching job", async () => {
    deleteJob.mockResolvedValue(undefined);

    const { DELETE } = await import("./route");

    const response = await DELETE(new Request("http://localhost/api/jobs/job-123"), {
      params: Promise.resolve({ jobId: "job-123" }),
    });

    expect(response.status).toBe(204);
    expect(deleteJob).toHaveBeenCalledWith("job-123");
  });
});
