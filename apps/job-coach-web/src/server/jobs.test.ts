import { describe, expect, it, vi } from "vitest";

const importJobFromUrlMock = vi.fn();

vi.mock("@coach/db", () => {
    return {
        createDbJobTracker: vi.fn(() => ({
            listJobs: vi.fn(),
            getJobById: vi.fn(),
            getDashboardSummary: vi.fn(),
            createJob: vi.fn(),
        })),
        createDbJobImporter: vi.fn(() => ({
            importJobFromUrl: importJobFromUrlMock,
        })),
    };
});

import { importJobFromUrl } from "./jobs";

describe("server/jobs.importJobFromUrl", () => {
    it("delegates to the db job importer", async () => {
        importJobFromUrlMock.mockResolvedValueOnce({
            id: "job-123",
            company: "Acme",
            title: "Backend Engineer",
            sourceUrl: "https://example.com/jobs/123",
            sourceText: "Build APIs",
            status: "saved",
        });

        const fetchPage = async (url: string) => {
            return {
                url,
                html: "<html></html>",
            };
        };

        const extractJob = async (_input: { url: string; html: string }) => {
            return {
                company: "Acme",
                title: "Backend Engineer",
                rawDescription: "Build APIs",
            };
        };

        const result = await importJobFromUrl(
            "https://example.com/jobs/123",
            {
                fetchPage,
                extractJob,
            },
        );

        expect(importJobFromUrlMock).toHaveBeenCalledWith(
            "https://example.com/jobs/123",
        );
        expect(result).toEqual({
            id: "job-123",
            company: "Acme",
            title: "Backend Engineer",
            sourceUrl: "https://example.com/jobs/123",
            sourceText: "Build APIs",
            status: "saved",
        });
    });
});