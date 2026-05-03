import { describe, expect, it } from "vitest";
import { InMemoryJobRepository } from "./in-memory-job-repository";
import { RepositoryBackedJobImporter } from "./repository-backed-job-importer";

describe("RepositoryBackedJobImporter.importJobFromUrl", () => {
  it("imports a job through the repository and persists it with source data", async () => {
    const repository = new InMemoryJobRepository();

    const importer = new RepositoryBackedJobImporter({
      repository,
      fetchPage: async (url: string) => {
        return {
          url,
          html: "<html><body>Backend Engineer</body></html>",
        };
      },
      extractJob: async (_input: { url: string; html: string }) => {
        return {
          company: "Acme",
          title: "Backend Engineer",
          rawDescription: "Build APIs",
          structuredSummary: {
            jobDescription: ["Build APIs"],
          },
          location: "Remote",
        };
      },
    });

    const result = await importer.importJobFromUrl("https://example.com/jobs/123");

    expect(result.id).toBeDefined();
    expect(result.company).toBe("Acme");
    expect(result.title).toBe("Backend Engineer");
    expect(result.sourceUrl).toBe("https://example.com/jobs/123");
    expect(result.sourceText).toBe("Build APIs");
    expect(result.structuredSummary).toEqual({
      jobDescription: ["Build APIs"],
    });
    expect(result.status).toBe("saved");

    const found = await repository.findJobBySourceUrl("https://example.com/jobs/123");

    expect(found).toEqual(result);
  });

  it("returns an existing job when the source URL was already imported", async () => {
    const repository = new InMemoryJobRepository();

    await repository.createJob({
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Original posting snapshot",
      status: "saved",
    });

    let fetchCalled = false;
    let extractCalled = false;

    const importer = new RepositoryBackedJobImporter({
      repository,
      fetchPage: async (url: string) => {
        fetchCalled = true;
        return {
          url,
          html: "<html></html>",
        };
      },
      extractJob: async (_input: { url: string; html: string }) => {
        extractCalled = true;
        return {
          company: "Acme",
          title: "Backend Engineer",
          rawDescription: "Build APIs",
        };
      },
    });

    const result = await importer.importJobFromUrl("https://example.com/jobs/123");

    expect(result.sourceUrl).toBe("https://example.com/jobs/123");
    expect(fetchCalled).toBe(false);
    expect(extractCalled).toBe(false);
  });
});
