import { describe, expect, it } from "vitest";
import { JobImporter, InvalidJobImportUrlError } from "./job-importer";

describe("JobImporter.importJobFromUrl", () => {
    it("rejects an invalid URL before attempting any external work", async () => {
        const fetchPage = async () => {
            throw new Error("fetchPage should not be called for invalid URLs");
        };

        const extractJob = async () => {
            throw new Error("extractJob should not be called for invalid URLs");
        };

        const saveImportedJob = async () => {
            throw new Error("saveImportedJob should not be called for invalid URLs");
        };

        const importer = new JobImporter({
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
            fetchPage: async () => {
                throw new Error("fetchPage should not be called for invalid URLs");
            },
            extractJob: async () => {
                throw new Error("extractJob should not be called for invalid URLs");
            },
            saveImportedJob: async () => {
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
            fetchPage: async (url) => {
                calls.push(url);
                return { html: "<html></html>" };
            },
            extractJob: async () => {
                return { title: "Backend Engineer" };
            },
            saveImportedJob: async () => {
                return { id: "job-123" };
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
            fetchPage: async () => fetchedPage,
            extractJob: async (input: unknown) => {
                receivedByExtractor = input;
                return { title: "Backend Engineer" };
            },
            saveImportedJob: async () => {
                return { id: "job-123" };
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
            fetchPage: async () => {
                return { html: "<html></html>" };
            },
            extractJob: async () => {
                return extractedJob;
            },
            saveImportedJob: async (input: unknown) => {
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
});