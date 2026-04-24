import { beforeEach, describe, expect, it, vi } from "vitest";

const listJobs = vi.fn();

vi.mock("@coach/db", async () => {
    const actual = await vi.importActual<object>("@coach/db");

    class MockDbJobRepository {
        listJobs = listJobs;
    }

    return {
        ...actual,
        DbJobRepository: MockDbJobRepository,
    };
});

beforeEach(() => {
    listJobs.mockReset();
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

        const response = await GET(
            new Request("http://localhost/api/jobs/job-123"),
            { params: Promise.resolve({ jobId: "job-123" }) },
        );

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

        const response = await GET(
            new Request("http://localhost/api/jobs/missing"),
            { params: Promise.resolve({ jobId: "missing" }) },
        );

        expect(response.status).toBe(404);
        await expect(response.json()).resolves.toMatchObject({
            error: "JOB_NOT_FOUND",
        });
    });
});
