import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}));
const { backfillJobMatchesMock } = vi.hoisted(() => ({
  backfillJobMatchesMock: vi.fn(),
}));

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<typeof import("@coach/db")>("@coach/db");

  return {
    ...actual,
    createServerClient: createServerClientMock,
  };
});

vi.mock("@/server/match/backfill-job-matches", () => ({
  backfillJobMatches: backfillJobMatchesMock,
}));

function createPostDbMock() {
  const operations: Array<{ table: string; op: string; payload?: unknown }> = [];

  const db = {
    from: vi.fn((table: string) => {
      let op = "";

      const builder = {
        insert: vi.fn((payload: unknown) => {
          op = "insert";
          operations.push({ table, op, payload });
          return builder;
        }),
        update: vi.fn((payload: unknown) => {
          op = "update";
          operations.push({ table, op, payload });
          return builder;
        }),
        delete: vi.fn(() => {
          op = "delete";
          operations.push({ table, op });
          return builder;
        }),
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn(async () => {
          if (table === "resume_profiles" && op === "insert") {
            return {
              data: {
                id: "profile-123",
                name: "Primary Resume",
                current_version_id: null,
              },
              error: null,
            };
          }

          if (table === "resume_versions" && op === "insert") {
            return {
              data: {
                id: "version-123",
                resume_profile_id: "profile-123",
                normalized_resume: { rawText: "Ian Handley" },
              },
              error: null,
            };
          }

          if (table === "resume_profiles" && op === "update") {
            return {
              data: {
                id: "profile-123",
                name: "Primary Resume",
                current_version_id: "version-123",
              },
              error: null,
            };
          }

          return { data: null, error: new Error("Unexpected query") };
        }),
      };

      return builder;
    }),
  };

  return { db, operations };
}

function createGetDbMock() {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => {
        if (table === "resume_profiles") {
          return {
            order: vi.fn(async () => ({
              data: [
                {
                  id: "profile-123",
                  name: "Primary Resume",
                  created_at: "2026-05-01T00:00:00Z",
                  current_version_id: "version-123",
                  source: { kind: "manual", label: "Baseline Resume" },
                },
              ],
              error: null,
            })),
          };
        }

        if (table === "resume_versions") {
          return {
            in: vi.fn(async () => ({
              data: [
                {
                  id: "version-123",
                  resume_profile_id: "profile-123",
                  version_number: 2,
                  kind: "tailored",
                  source_kind: "tailored",
                  source_label: "Primary Resume - Pattern",
                  created_at: "2026-05-01T01:00:00Z",
                },
              ],
              error: null,
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    })),
  };
}

describe("GET /api/resume-profiles", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("returns currentVersionId for each profile", async () => {
    createServerClientMock.mockReturnValue(createGetDbMock());
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: "profile-123",
        name: "Primary Resume",
        created_at: "2026-05-01T00:00:00Z",
        current_version_id: "version-123",
        currentVersionId: "version-123",
        currentVersion: {
          id: "version-123",
          resumeProfileId: "profile-123",
          versionNumber: 2,
          kind: "tailored",
          source: {
            kind: "tailored",
            label: "Primary Resume - Pattern",
          },
          created_at: "2026-05-01T01:00:00Z",
        },
        source: { kind: "manual", label: "Baseline Resume" },
      },
    ]);
  });
});

describe("POST /api/resume-profiles", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    backfillJobMatchesMock.mockReset();
  });

  it("creates a resume profile and linked version", async () => {
    const normalizedResume = {
      basics: {
        name: "Ian Handley",
        email: "ian@example.com",
      },
      skills: ["TypeScript"],
      experience: [],
      education: [],
      rawText: "Ian Handley\nian@example.com\nTypeScript",
    };
    const { db, operations } = createPostDbMock();
    createServerClientMock.mockReturnValue(db);
    backfillJobMatchesMock.mockResolvedValue({ updated: 3, resumeProfileId: "profile-123" });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles", {
        method: "POST",
        body: JSON.stringify({
          name: "Primary Resume",
          source: { kind: "manual", label: "Baseline Resume" },
          normalizedResume,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(201);
    expect(operations).toEqual([
      {
        table: "resume_profiles",
        op: "insert",
        payload: {
          name: "Primary Resume",
          source: { kind: "manual", label: "Baseline Resume" },
          normalized_resume: normalizedResume,
        },
      },
      {
        table: "resume_versions",
        op: "insert",
        payload: {
          resume_profile_id: "profile-123",
          version_number: 1,
          kind: "baseline",
          source_kind: "manual",
          source_label: "Baseline Resume",
          normalized_resume: normalizedResume,
        },
      },
      {
        table: "resume_profiles",
        op: "update",
        payload: {
          current_version_id: "version-123",
        },
      },
    ]);
    expect(backfillJobMatchesMock).toHaveBeenCalledWith(db);
    expect(await response.json()).toEqual({
      profile: {
        id: "profile-123",
        name: "Primary Resume",
        current_version_id: "version-123",
      },
      version: {
        id: "version-123",
        resume_profile_id: "profile-123",
        normalized_resume: { rawText: "Ian Handley" },
      },
      matchRefresh: {
        updated: 3,
        resumeProfileId: "profile-123",
      },
    });
  });

  it("returns 400 for invalid input", async () => {
    createServerClientMock.mockReturnValue({ from: vi.fn() });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles", {
        method: "POST",
        body: JSON.stringify({
          name: 123,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "INVALID_RESUME_PROFILE_INPUT",
    });
  });
});
