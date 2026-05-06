import { beforeEach, describe, expect, it, vi } from "vitest";

type WhereState = {
  column: string;
  value: unknown;
};

const { dbMock, kyselyDbMock, selectFromMock } = vi.hoisted(() => {
  const dbMock = {
    from: vi.fn(() => {
      throw new Error("Supabase route logic should not be used by review route");
    }),
  };
  const selectFromMock = vi.fn();
  const kyselyDbMock = {
    selectFrom: selectFromMock,
  };

  return {
    dbMock,
    kyselyDbMock,
    selectFromMock,
  };
});

vi.mock("../../../../../server/db", () => ({
  db: dbMock,
  kyselyDb: kyselyDbMock,
}));

function createKyselySelectMock() {
  const rowsByTable = new Map<string, Array<Record<string, unknown>>>([
    [
      "resume_profiles",
      [
        {
          id: "profile-1",
          name: "Primary Resume",
          current_version_id: "version-1",
        },
      ],
    ],
    [
      "resume_versions",
      [
        {
          id: "version-1",
          profile_id: "profile-1",
          version_number: 1,
          kind: "baseline",
          source_kind: "manual",
          source_label: "Primary Resume",
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
          source_resume_version_id: null,
          source_job_id: null,
        },
      ],
    ],
  ]);

  selectFromMock.mockImplementation((table: string) => {
    const state: {
      where?: WhereState;
    } = {};

    const builder = {
      selectAll() {
        return builder;
      },
      where(column: string, operator: string, value: unknown) {
        if (operator !== "=") {
          throw new Error(`Unsupported test operator: ${operator}`);
        }

        state.where = { column, value };

        return builder;
      },
      async executeTakeFirst() {
        const rows = rowsByTable.get(table) ?? [];

        if (!state.where) {
          return rows[0];
        }

        return rows.find((row) => row[state.where?.column ?? ""] === state.where?.value);
      },
    };

    return builder;
  });
}

describe("GET /api/resume-profiles/[id]/review", () => {
  beforeEach(() => {
    vi.resetModules();
    dbMock.from.mockClear();
    selectFromMock.mockReset();
  });

  it("returns the current baseline review using the Kysely-style db adapter", async () => {
    createKyselySelectMock();

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
    expect(selectFromMock).toHaveBeenCalledWith("resume_profiles");
    expect(selectFromMock).toHaveBeenCalledWith("resume_versions");
    expect(dbMock.from).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      resumeProfileId: "profile-1",
      resumeVersionId: "version-1",
      review: {
        coreStrengths: expect.arrayContaining(["Includes a clear professional headline."]),
      },
    });
  });

  it("returns 404 when the resume profile does not exist", async () => {
    selectFromMock.mockImplementation(() => {
      const builder = {
        selectAll() {
          return builder;
        },
        where() {
          return builder;
        },
        async executeTakeFirst() {
          return undefined;
        },
      };

      return builder;
    });

    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/resume-profiles/missing/review"), {
      params: Promise.resolve({
        id: "missing",
      }),
    });

    expect(response.status).toBe(404);
    expect(dbMock.from).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: "RESUME_PROFILE_NOT_FOUND",
    });
  });
});
