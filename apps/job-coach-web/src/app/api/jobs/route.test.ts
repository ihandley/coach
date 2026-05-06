process.env.SUPABASE_URL = "http://127.0.0.1:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

import { beforeEach, describe, expect, it, vi } from "vitest";

const listJobs = vi.fn();
const createJob = vi.fn();
const findJobBySourceUrl = vi.fn();
const fetchJobPageAsDependency = vi.fn();
const generateStructuredSummary = vi.fn();
const writeAutomatedImportBackup = vi.fn();
const jobMatchUpsert = vi.fn();
const dbFrom = vi.fn();

const fakeDb = {
  from: dbFrom,
};

function createMaybeSingleQuery(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
  };

  return query;
}

function createJobMatchesQuery() {
  return {
    upsert: jobMatchUpsert,
  };
}

vi.mock("@coach/ai", async () => {
  const actual = await vi.importActual<object>("@coach/ai");

  return {
    ...actual,
    fetchJobPageAsDependency,
  };
});

vi.mock("@/server/ai/structured-job-summary", () => ({
  generateStructuredSummary,
}));

vi.mock("@/server/data-backup", () => ({
  writeAutomatedImportBackup,
}));

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<object>("@coach/db");
  const core = await vi.importActual<typeof import("@coach/core")>("@coach/core");

  class MockDbJobRepository {
    listJobs = listJobs;
    createJob = createJob;
    findJobBySourceUrl = findJobBySourceUrl;
  }

  return {
    ...actual,
    createServerClient: vi.fn(() => fakeDb),
    DbJobRepository: MockDbJobRepository,
    createDbJobImporter: vi.fn(
      (dependencies: { fetchPage: unknown; extractJob: unknown }) =>
        new core.RepositoryBackedJobImporter({
          repository: new MockDbJobRepository() as never,
          fetchPage: dependencies.fetchPage as never,
          extractJob: dependencies.extractJob as never,
        }),
    ),
  };
});

beforeEach(() => {
  listJobs.mockReset();
  createJob.mockReset();
  findJobBySourceUrl.mockReset();
  fetchJobPageAsDependency.mockReset();
  generateStructuredSummary.mockReset();
  writeAutomatedImportBackup.mockReset();
  jobMatchUpsert.mockReset();
  dbFrom.mockReset();
  writeAutomatedImportBackup.mockResolvedValue(undefined);
  jobMatchUpsert.mockResolvedValue({ error: null });
  dbFrom.mockImplementation((table: string) => {
    if (table === "resume_profiles") {
      return createMaybeSingleQuery({
        data: {
          id: "resume-profile-1",
          normalized_resume: {
            basics: {
              summary: "TypeScript product workflows",
            },
            skills: ["TypeScript"],
            experience: [],
            education: [],
          },
          created_at: "2026-04-20T10:00:00.000Z",
        },
        error: null,
      });
    }

    if (table === "job_matches") {
      return createJobMatchesQuery();
    }

    return createMaybeSingleQuery({ data: null, error: null });
  });
  vi.resetModules();
});

describe("GET /api/jobs", () => {
  it("returns jobs from the tracker", async () => {
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

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject([
      {
        id: "job-123",
        company: "Acme",
        title: "Senior Software Engineer",
        status: "saved",
        updatedAt: "2026-04-23T10:00:00.000Z",
      },
    ]);
  });
});

describe("POST /api/jobs", () => {
  it("stores clean title, company, source text, and structured summary for LinkedIn-like imports", async () => {
    const structuredSummary = {
      location: "Lehi, UT",
      salaryRange: null,
      companyInfo: ["Pattern builds predictive hiring products."],
      jobDescription: ["Build predictive hiring workflows."],
      requirements: ["TypeScript"],
      benefits: [],
    };

    findJobBySourceUrl.mockResolvedValue(null);
    fetchJobPageAsDependency.mockResolvedValue({
      url: "https://www.linkedin.com/jobs/view/123",
      html: `
        <html>
          <head>
            <meta property="og:title" content="Pattern hiring Staff Software Engineer, Predict in Lehi, UT | LinkedIn" />
            <meta property="og:site_name" content="LinkedIn" />
          </head>
          <body>
            <div class="show-more-less-html__markup">
              <p>About the job</p>
              <p>Build predictive hiring workflows.</p>
              <ul>
                <li>TypeScript</li>
              </ul>
              <p>Report this job</p>
            </div>
          </body>
        </html>
      `,
    });
    generateStructuredSummary.mockResolvedValue(structuredSummary);
    createJob.mockImplementation(async (input) => ({
      id: "job-123",
      createdAt: "2026-04-20T10:00:00.000Z",
      updatedAt: "2026-04-23T10:00:00.000Z",
      ...input,
    }));

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          sourceUrl: "https://www.linkedin.com/jobs/view/123",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        company: "Pattern",
        title: "Staff Software Engineer, Predict",
        sourceUrl: "https://www.linkedin.com/jobs/view/123",
        sourceText: expect.stringContaining("Build predictive hiring workflows."),
        structuredSummary,
        status: "saved",
      }),
    );
    expect(createJob.mock.calls[0][0].sourceText).not.toContain("Report this job");
    expect(writeAutomatedImportBackup).toHaveBeenCalledTimes(1);
    expect(jobMatchUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        job_id: "job-123",
        resume_profile_id: "resume-profile-1",
        score: expect.any(Number),
        created_at: expect.any(String),
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      id: "job-123",
      company: "Pattern",
      title: "Staff Software Engineer, Predict",
      structuredSummary,
    });
  });

  it("backs up data before manually imported source text is saved", async () => {
    generateStructuredSummary.mockResolvedValue(null);
    createJob.mockImplementation(async (input) => ({
      id: "job-456",
      createdAt: "2026-04-20T10:00:00.000Z",
      updatedAt: "2026-04-23T10:00:00.000Z",
      ...input,
    }));

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          sourceText: "Company: Acme\nTitle: Staff Engineer\nBuild reliable workflows.",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(writeAutomatedImportBackup).toHaveBeenCalledTimes(1);
    expect(writeAutomatedImportBackup.mock.invocationCallOrder[0]).toBeLessThan(
      createJob.mock.invocationCallOrder[0],
    );
    expect(jobMatchUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        job_id: "job-456",
        resume_profile_id: "resume-profile-1",
        score: expect.any(Number),
        created_at: expect.any(String),
      }),
    );
  });
});
