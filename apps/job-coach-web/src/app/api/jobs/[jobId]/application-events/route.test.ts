import { beforeEach, describe, expect, it, vi } from "vitest";

const listApplicationEvents = vi.fn();

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<object>("@coach/db");

    class MockDbJobRepository {
        listApplicationEvents = listApplicationEvents;
    }

    return {
        ...actual,
        DbJobRepository: MockDbJobRepository,
    };
});

beforeEach(() => {
    listApplicationEvents.mockReset();
    vi.resetModules();
});

describe("GET /api/jobs/[jobId]/application-events", () => {
    it("returns application events for the job", async () => {
        listApplicationEvents.mockResolvedValue([
            {
                id: "event-1",
                jobId: "job-123",
                type: "note_added",
                note: "Recruiter reached out",
                createdAt: "2026-04-21T10:00:00.000Z",
            },
            {
                id: "event-2",
                jobId: "job-123",
                type: "status_changed",
                note: "Moved to interview stage",
                createdAt: "2026-04-22T15:30:00.000Z",
            },
        ]);

        const { GET } = await import("./route");

        const response = await GET(
            new Request("http://localhost/api/jobs/job-123/application-events"),
            { params: { jobId: "job-123" } },
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject([
            {
                id: "event-1",
                jobId: "job-123",
                type: "note_added",
                note: "Recruiter reached out",
                createdAt: "2026-04-21T10:00:00.000Z",
            },
            {
                id: "event-2",
                jobId: "job-123",
                type: "status_changed",
                note: "Moved to interview stage",
                createdAt: "2026-04-22T15:30:00.000Z",
            },
        ]);
    });
});
