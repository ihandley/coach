import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createApplicationAnswerMock,
  createServerClientMock,
  resumeProfileQueryMock,
  resumeVersionQueryMock,
  getJobByIdMock,
  serverClient,
  DbJobRepositoryMock,
} = vi.hoisted(() => {
  const resumeProfileQueryMock = vi.fn();
  const resumeVersionQueryMock = vi.fn();
  const serverClient = { from: vi.fn() };

  return {
    createApplicationAnswerMock: vi.fn(),
    createServerClientMock: vi.fn(() => serverClient),
    resumeProfileQueryMock,
    resumeVersionQueryMock,
    getJobByIdMock: vi.fn(),
    serverClient,
    DbJobRepositoryMock: vi.fn().mockImplementation(function DbJobRepository() {
      return {
        getJobById: vi.fn(),
      };
    }),
  };
});

vi.mock("@coach/core", async () => {
  const actual = await vi.importActual<typeof import("@coach/core")>("@coach/core");

  return {
    ...actual,
    createApplicationAnswer: createApplicationAnswerMock,
  };
});

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<typeof import("@coach/db")>("@coach/db");

  return {
    ...actual,
    createServerClient: createServerClientMock,
    DbJobRepository: DbJobRepositoryMock.mockImplementation(function DbJobRepository() {
      return {
        getJobById: getJobByIdMock,
      };
    }),
  };
});

describe("POST /api/resume-profiles/[id]/application-answers/from-job", () => {
  beforeEach(() => {
    createApplicationAnswerMock.mockReset();
    createServerClientMock.mockReset();
    createServerClientMock.mockReturnValue(serverClient);
    DbJobRepositoryMock.mockClear();
    resumeProfileQueryMock.mockReset();
    resumeVersionQueryMock.mockReset();
    getJobByIdMock.mockReset();
    serverClient.from.mockImplementation((table: string) => {
      if (table === "resume_profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: resumeProfileQueryMock,
            }),
          }),
        };
      }

      if (table === "resume_versions") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: resumeVersionQueryMock,
            }),
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });
  });

  it("creates an application answer from stored job and resume data", async () => {
    resumeProfileQueryMock.mockResolvedValue({
      data: {
        id: "resume-profile-123",
        current_version_id: "resume-version-123",
      },
      error: null,
    });
    resumeVersionQueryMock.mockResolvedValue({
      data: {
        id: "resume-version-123",
        normalized_resume: {
          basics: {
            fullName: "Ian Handley",
            headline: "Senior Software Engineer",
            summary:
              "Software engineer with experience building web applications, APIs, and internal tools.",
          },
          skills: ["TypeScript", "React", "Node.js"],
          experience: [],
          education: [],
        },
      },
      error: null,
    });

    getJobByIdMock.mockResolvedValue({
      id: "job-123",
      title: "Senior Software Engineer",
      company: "Acme",
      sourceText:
        "Build product features, collaborate across teams, and improve developer experience.",
    });

    createApplicationAnswerMock.mockResolvedValue({
      answer:
        "I am interested in the Senior Software Engineer role at Acme because it aligns with my experience.",
    });

    const { POST } = await import("./route");

    const request = new Request(
      "http://localhost/api/resume-profiles/resume-profile-123/application-answers/from-job",
      {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          question: "Why are you interested in this role?",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        id: "resume-profile-123",
      }),
    });

    expect(response.status).toBe(201);
    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    expect(serverClient.from).toHaveBeenCalledWith("resume_profiles");
    expect(serverClient.from).toHaveBeenCalledWith("resume_versions");
    expect(DbJobRepositoryMock).toHaveBeenCalledWith(serverClient);

    expect(createApplicationAnswerMock).toHaveBeenCalledWith({
      question: "Why are you interested in this role?",
      candidateName: "Ian Handley",
      companyName: "Acme",
      jobTitle: "Senior Software Engineer",
      jobSummary:
        "Build product features, collaborate across teams, and improve developer experience.",
      resumeSummary:
        "Software engineer with experience building web applications, APIs, and internal tools.",
    });

    expect(await response.json()).toEqual({
      answer:
        "I am interested in the Senior Software Engineer role at Acme because it aligns with my experience.",
    });
  });

  it("returns 400 for invalid input", async () => {
    const { POST } = await import("./route");

    const request = new Request(
      "http://localhost/api/resume-profiles/resume-profile-123/application-answers/from-job",
      {
        method: "POST",
        body: JSON.stringify({
          jobId: 123,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        id: "resume-profile-123",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid request body",
    });
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(createApplicationAnswerMock).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed json", async () => {
    const { POST } = await import("./route");

    const request = new Request(
      "http://localhost/api/resume-profiles/resume-profile-123/application-answers/from-job",
      {
        method: "POST",
        body: "{not-valid-json",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        id: "resume-profile-123",
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid request body",
    });
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(createApplicationAnswerMock).not.toHaveBeenCalled();
  });

  it("returns 404 when stored resume or job data is missing", async () => {
    resumeProfileQueryMock.mockResolvedValue({
      data: {
        id: "resume-profile-123",
        current_version_id: null,
      },
      error: null,
    });
    getJobByIdMock.mockResolvedValue(null);

    const { POST } = await import("./route");

    const request = new Request(
      "http://localhost/api/resume-profiles/resume-profile-123/application-answers/from-job",
      {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          question: "Why are you interested in this role?",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        id: "resume-profile-123",
      }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Required data not found",
    });
    expect(createApplicationAnswerMock).not.toHaveBeenCalled();
  });
});
