import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClientMock, resumeProfileQueryMock, resumeVersionQueryMock, serverClient } =
  vi.hoisted(() => {
    const resumeProfileQueryMock = vi.fn();
    const resumeVersionQueryMock = vi.fn();
    const serverClient = { from: vi.fn() };

    return {
      createServerClientMock: vi.fn(() => serverClient),
      resumeProfileQueryMock,
      resumeVersionQueryMock,
      serverClient,
    };
  });

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<object>("@coach/db");

  return {
    ...actual,
    createServerClient: createServerClientMock,
  };
});

function mockResumeProfileQueries() {
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
}

describe("GET /api/resume-profiles/[id]/review", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    resumeProfileQueryMock.mockReset();
    resumeVersionQueryMock.mockReset();
    serverClient.from.mockReset();
  });

  it("returns the current baseline review for a resume profile", async () => {
    createServerClientMock.mockReturnValue(serverClient);
    resumeProfileQueryMock.mockResolvedValue({
      data: {
        id: "profile-1",
        current_version_id: "version-1",
      },
      error: null,
    });
    resumeVersionQueryMock.mockResolvedValue({
      data: {
        id: "version-1",
        normalized_resume: {
          basics: {
            headline: "Software Engineer",
            summary: "Builds product software.",
          },
          skills: ["TypeScript"],
          experience: [
            {
              company: "Acme",
              title: "Software Engineer",
              highlights: ["Built APIs."],
            },
          ],
          education: [],
        },
      },
      error: null,
    });
    mockResumeProfileQueries();

    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/resume-profiles/profile-1/review"),
      {
        params: Promise.resolve({
          id: "profile-1",
        }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "profile-1",
      resumeVersionId: "version-1",
      review: {
        coreStrengths: expect.arrayContaining(["Includes a clear professional headline."]),
      },
    });
  });

  it("returns 404 when the resume profile does not exist", async () => {
    createServerClientMock.mockReturnValue(serverClient);
    resumeProfileQueryMock.mockResolvedValue({
      data: null,
      error: null,
    });
    mockResumeProfileQueries();

    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/resume-profiles/missing/review"), {
      params: Promise.resolve({
        id: "missing",
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: "RESUME_PROFILE_NOT_FOUND",
    });
  });
});
