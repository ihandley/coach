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
});