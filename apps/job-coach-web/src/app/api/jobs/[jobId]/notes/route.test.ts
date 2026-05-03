import { beforeEach, describe, expect, it, vi } from "vitest";

const addApplicationEvent = vi.fn();

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<object>("@coach/db");

  class MockDbJobRepository {
    addApplicationEvent = addApplicationEvent;
  }

  return {
    ...actual,
    DbJobRepository: MockDbJobRepository,
  };
});

beforeEach(() => {
  addApplicationEvent.mockReset();
  vi.resetModules();
});

describe("POST /api/jobs/[jobId]/notes", () => {
  it("creates a note_added application event", async () => {
    addApplicationEvent.mockResolvedValue({
      id: "event-1",
      jobId: "job-123",
      type: "note_added",
      note: "Reached out to recruiter",
      createdAt: "2026-04-23T10:00:00.000Z",
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/jobs/job-123/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: "Reached out to recruiter" }),
      }),
      { params: Promise.resolve({ jobId: "job-123" }) },
    );

    expect(addApplicationEvent).toHaveBeenCalledWith({
      jobId: "job-123",
      type: "note_added",
      note: "Reached out to recruiter",
    });
    expect(response.status).toBe(200);
  });

  it("returns 400 for invalid input", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/jobs/job-123/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: "" }),
      }),
      { params: Promise.resolve({ jobId: "job-123" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "INVALID_JOB_NOTE_INPUT",
    });
  });
});
