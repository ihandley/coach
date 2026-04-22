import { describe, expect, expectTypeOf, it } from "vitest";
import {
    JobImporter,
    InvalidExtractedJobDataError,
    InvalidJobImportUrlError,
    type SavedImportedJob,
} from "./job-importer";

describe("JobImporter.importJobFromUrl", () => {
    it("rejects an invalid URL before attempting any external work", async () => {
        const fetchPage = async (_url: string) => {
            throw new Error("fetchPage should not be called for invalid URLs");
        };

        const extractJob = async (_input: { url: string; html: string }) => {
            throw new Error("extractJob should not be called for invalid URLs");
        };

        const saveImportedJob = async (
            _input: {
                company: string;
                title: string;
                rawDescription: string;
            },
        ) => {
            throw new Error("saveImportedJob should not be called for invalid URLs");
        };

        const importer = new JobImporter({
            findImportedJobBySourceUrl: async (_url: string) => null,
            fetchPage,
            extractJob,
            saveImportedJob,
        });

        await expect(() => importer.importJobFromUrl("not-a-url")).rejects.toThrow(
            InvalidJobImportUrlError,
        );
    });

    it("rejects a non-http URL", async () => {
        const importer = new JobImporter({
            findImportedJobBySourceUrl: async (_url: string) => null,
            fetchPage: async (_url: string) => {
                throw new Error("fetchPage should not be called for invalid URLs");
            },
            extractJob: async (_input: { url: string; html: string }) => {
                throw new Error("extractJob should not be called for invalid URLs");
            },
            saveImportedJob: async (
                _input: {
                    company: string;
                    title: string;
                    rawDescription: string;
                },
            ) => {
                throw new Error("saveImportedJob should not be called for invalid URLs");
            },
        });

        await expect(() =>
            importer.importJobFromUrl("ftp://example.com/job/123"),
        ).rejects.toThrow(InvalidJobImportUrlError);
    });

    it("calls fetchPage with the exact valid URL", async () => {
        const calls: string[] = [];

        const importer = new JobImporter({
            findImportedJobBySourceUrl: async (_url: string) => null,
            fetchPage: async (url: string) => {
                calls.push(url);
                return {
                    url,
                    html: "<html></html>",
                };
            },
            extractJob: async (_input: { url: string; html: string }) => {
                return {
                    company: "Acme",
                    title: "Backend Engineer",
                    rawDescription: "Build APIs",
                };
            },
            saveImportedJob: async (
                input: {
                    company: string;
                    title: string;
                    rawDescription: string;
                },
            ) => {
                return {
                    id: "job-123",
                    ...input,
                };
            },
        });

        await importer.importJobFromUrl("https://example.com/jobs/123");

        expect(calls).toEqual(["https://example.com/jobs/123"]);
    });

    it("passes fetched page content into extractJob", async () => {
        const fetchedPage = {
            url: "https://example.com/jobs/123",
            html: "<html><body>Backend Engineer</body></html>",
        };

        let receivedByExtractor: unknown;

        const importer = new JobImporter({
            findImportedJobBySourceUrl: async (_url: string) => null,
            fetchPage: async (_url: string) => fetchedPage,
            extractJob: async (input: { url: string; html: string }) => {
                receivedByExtractor = input;
                return {
                    company: "Acme",
                    title: "Backend Engineer",
                    rawDescription: "Build APIs",
                };
            },
            saveImportedJob: async (
                input: {
                    company: string;
                    title: string;
                    rawDescription: string;
                },
            ) => {
                return {
                    id: "job-123",
                    ...input,
                };
            },
        });

        await importer.importJobFromUrl("https://example.com/jobs/123");

        expect(receivedByExtractor).toEqual(fetchedPage);
    });

    it("passes extracted job data into saveImportedJob and returns the saved job", async () => {
        const extractedJob = {
            company: "Acme",
            title: "Backend Engineer",
            rawDescription: "Build APIs",
        };

        let receivedBySave: unknown;

        const savedJob = {
            id: "job-123",
            ...extractedJob,
        };

        const importer = new JobImporter({
            findImportedJobBySourceUrl: async (_url: string) => null,
            fetchPage: async (url: string) => {
                return { url, html: "<html></html>" };
            },
            extractJob: async (_input: { url: string; html: string }) => {
                return extractedJob;
            },
            saveImportedJob: async (
                input: {
                    company: string;
                    title: string;
                    rawDescription: string;
                },
            ) => {
                receivedBySave = input;
                return savedJob;
            },
        });

        const result = await importer.importJobFromUrl(
            "https://example.com/jobs/123",
        );

        expect(receivedBySave).toEqual(extractedJob);
        expect(result).toEqual(savedJob);
    });

    it("returns a typed saved job result", async () => {
        const importer = new JobImporter({
            findImportedJobBySourceUrl: async (_url: string) => null,
            fetchPage: async (url: string) => {
                return { url, html: "<html></html>" };
            },
            extractJob: async (_input: { url: string; html: string }) => {
                return {
                    company: "Acme",
                    title: "Backend Engineer",
                    rawDescription: "Build APIs",
                };
            },
            saveImportedJob: async (
                input: {
                    company: string;
                    title: string;
                    rawDescription: string;
                },
            ) => {
                return {
                    id: "job-123",
                    ...input,
                };
            },
        });

        const result = await importer.importJobFromUrl(
            "https://example.com/jobs/123",
        );

        expectTypeOf(result).toMatchTypeOf<{
            id: string;
            company: string;
            title: string;
            rawDescription: string;
        }>();
    });

    it("rejects malformed extracted job data before save", async () => {
        let saveCalled = false;

        const importer = new JobImporter({
            findImportedJobBySourceUrl: async (_url: string) => null,
            fetchPage: async (url: string) => {
                return { url, html: "<html></html>" };
            },
            extractJob: async (_input: { url: string; html: string }) => {
                return {
                    company: "Acme",
                    title: "Backend Engineer",
                    // rawDescription is intentionally missing
                } as never;
            },
            saveImportedJob: async (
                input: {
                    company: string;
                    title: string;
                    rawDescription: string;
                },
            ) => {
                saveCalled = true;
                return {
                    id: "job-123",
                    ...input,
                };
            },
        });

        await expect(() =>
            importer.importJobFromUrl("https://example.com/jobs/123"),
        ).rejects.toThrow(InvalidExtractedJobDataError);

        expect(saveCalled).toBe(false);
    });

    it("allows partial extracted job data as long as minimum required fields exist", async () => {
        let receivedBySave: unknown;

        const importer = new JobImporter({
            findImportedJobBySourceUrl: async (_url: string) => null,
            fetchPage: async (url: string) => {
                return { url, html: "<html></html>" };
            },
            extractJob: async () => {
                return {
                    company: "Acme",
                    title: "Backend Engineer",
                    rawDescription: "Build APIs",
                    location: "Remote",
                    compensationText: "$150k-$180k",
                };
            },
            saveImportedJob: async (input) => {
                receivedBySave = input;

                return {
                    id: "job-123",
                    ...input,
                } as SavedImportedJob;
            },
        });

        const result = await importer.importJobFromUrl(
            "https://example.com/jobs/123",
        );

        expect(receivedBySave).toEqual({
            company: "Acme",
            title: "Backend Engineer",
            rawDescription: "Build APIs",
            location: "Remote",
            compensationText: "$150k-$180k",
        });

        expect(result).toEqual({
            id: "job-123",
            company: "Acme",
            title: "Backend Engineer",
            rawDescription: "Build APIs",
            location: "Remote",
            compensationText: "$150k-$180k",
        });
    });

    it("returns an existing imported job when the source URL was already imported", async () => {
        const existingJob = {
            id: "job-existing",
            company: "Acme",
            title: "Backend Engineer",
            rawDescription: "Build APIs",
            sourceUrl: "https://example.com/jobs/123",
        };

        let fetchCalled = false;
        let extractCalled = false;
        let saveCalled = false;

        const importer = new JobImporter({
            findImportedJobBySourceUrl: async (url: string) => {
                return url === "https://example.com/jobs/123" ? existingJob : null;
            },
            fetchPage: async (url: string) => {
                fetchCalled = true;
                return { url, html: "<html></html>" };
            },
            extractJob: async (_input: { url: string; html: string }) => {
                extractCalled = true;
                return {
                    company: "Acme",
                    title: "Backend Engineer",
                    rawDescription: "Build APIs",
                };
            },
            saveImportedJob: async (
                input: {
                    company: string;
                    title: string;
                    rawDescription: string;
                },
            ) => {
                saveCalled = true;
                return {
                    id: "job-123",
                    sourceUrl: "https://example.com/jobs/123",
                    ...input,
                };
            },
        });

        const result = await importer.importJobFromUrl(
            "https://example.com/jobs/123",
        );

        expect(result).toEqual(existingJob);
        expect(fetchCalled).toBe(false);
        expect(extractCalled).toBe(false);
        expect(saveCalled).toBe(false);
    });
});