import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<typeof import("@coach/db")>("@coach/db");

  return {
    ...actual,
    createServerClient: createServerClientMock,
  };
});

describe("GET /api/resume-profiles/:id", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("returns structured JSON for the preview modal", async () => {
    const normalizedResume = {
      basics: { name: "Ian Handley", email: "ian@example.com" },
      skills: ["TypeScript"],
      experience: [],
      education: [],
      rawText: "Ian Handley",
    };
    const profileBuilder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => ({
        data: {
          id: "profile-123",
          name: "Primary Resume",
          created_at: "2026-05-01T00:00:00Z",
          current_version_id: "version-123",
          source: { kind: "import", label: "resume.pdf" },
        },
        error: null,
      })),
    };
    const versionBuilder = {
      select: vi.fn(() => versionBuilder),
      eq: vi.fn(() => versionBuilder),
      maybeSingle: vi.fn(async () => ({
        data: {
          id: "version-123",
          resume_profile_id: "profile-123",
          created_at: "2026-05-01T00:00:00Z",
          normalized_resume: normalizedResume,
        },
        error: null,
      })),
    };
    const builder = profileBuilder;
    createServerClientMock.mockReturnValue({
      from: vi.fn((table: string) =>
        table === "resume_profiles" ? profileBuilder : versionBuilder,
      ),
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/resume-profiles/profile-123"), {
      params: Promise.resolve({ id: "profile-123" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      profile: {
        id: "profile-123",
        name: "Primary Resume",
        created_at: "2026-05-01T00:00:00Z",
        current_version_id: "version-123",
        source: { kind: "import", label: "resume.pdf" },
      },
      version: {
        id: "version-123",
        resume_profile_id: "profile-123",
        created_at: "2026-05-01T00:00:00Z",
        normalized_resume: normalizedResume,
      },
    });
  });
});
