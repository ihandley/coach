import { describe, expect, it } from "vitest";

import { createDbResumeVersionRepository } from "./db-resume-version-repository";

describe("createDbResumeVersionRepository", () => {
  it("creates, retrieves, and lists resume versions", async () => {
    const rows = new Map<
      string,
      {
        id: string;
        profile_id: string;
        version_number: number;
        kind: "baseline" | "tailored";
        source_kind: string;
        source_label: string;
        normalized_resume: {
          basics: {
            fullName: string;
            headline: string;
            summary: string;
          };
          skills: string[];
          experience: Array<{
            company: string;
            title: string;
            highlights: string[];
          }>;
          education: unknown[];
        };
        source_resume_version_id: string | null;
        source_job_id: string | null;
      }
    >();

    const db = {
      insertInto(table: string) {
        expect(table).toBe("resume_versions");

        return {
          values(input: {
            id?: string;
            profile_id: string;
            version_number: number;
            kind: "baseline" | "tailored";
            source_kind: string;
            source_label: string;
            normalized_resume: {
              basics: {
                fullName: string;
                headline: string;
                summary: string;
              };
              skills: string[];
              experience: Array<{
                company: string;
                title: string;
                highlights: string[];
              }>;
              education: unknown[];
            };
            source_resume_version_id: string | null;
            source_job_id: string | null;
          }) {
            const row = {
              id: input.id ?? crypto.randomUUID(),
              profile_id: input.profile_id,
              version_number: input.version_number,
              kind: input.kind,
              source_kind: input.source_kind,
              source_label: input.source_label,
              normalized_resume: input.normalized_resume,
              source_resume_version_id: input.source_resume_version_id,
              source_job_id: input.source_job_id,
            };

            rows.set(row.id, row);

            return {
              returningAll() {
                return {
                  executeTakeFirstOrThrow: async () => row,
                };
              },
            };
          },
        };
      },

      selectFrom(table: string) {
        expect(table).toBe("resume_versions");

        return {
          selectAll() {
            return {
              where(column: string, operator: string, value: string) {
                if (column === "id") {
                  expect(operator).toBe("=");

                  return {
                    executeTakeFirst: async () => rows.get(value) ?? undefined,
                  };
                }

                if (column === "profile_id") {
                  expect(operator).toBe("=");

                  return {
                    orderBy(orderColumn: string, direction: string) {
                      expect(orderColumn).toBe("version_number");
                      expect(direction).toBe("asc");

                      return {
                        execute: async () =>
                          Array.from(rows.values())
                            .filter((row) => row.profile_id === value)
                            .sort((a, b) => a.version_number - b.version_number),
                      };
                    },
                  };
                }

                throw new Error(`Unexpected where column: ${column}`);
              },
            };
          },
        };
      },
    };

    const repo = createDbResumeVersionRepository({ db });

    const created = await repo.createResumeVersion({
      profileId: "profile-1",
      versionNumber: 1,
      kind: "baseline",
      source: {
        kind: "manual",
        label: "baseline-resume",
      },
      normalizedResume: {
        basics: {
          fullName: "Ian Handley",
          headline: "Software Engineer",
          summary: "Builds reliable product systems",
        },
        skills: ["TypeScript", "React"],
        experience: [
          {
            company: "Acme",
            title: "Software Engineer",
            highlights: ["Built internal tools"],
          },
        ],
        education: [],
      },
    });

    expect(created).toMatchObject({
      id: expect.any(String),
      profileId: "profile-1",
      versionNumber: 1,
      kind: "baseline",
      source: {
        kind: "manual",
        label: "baseline-resume",
      },
      lineage: undefined,
    });

    const fetched = await repo.getResumeVersionById(created.id);

    expect(fetched).toEqual(created);

    await repo.createResumeVersion({
      profileId: "profile-1",
      versionNumber: 2,
      kind: "tailored",
      source: {
        kind: "manual",
        label: "baseline-resume-v2",
      },
      normalizedResume: {
        basics: {
          fullName: "Ian Handley",
          headline: "Senior Software Engineer",
          summary: "Builds reliable product systems and leads delivery",
        },
        skills: ["TypeScript", "React", "Node.js"],
        experience: [
          {
            company: "Acme",
            title: "Senior Software Engineer",
            highlights: ["Led delivery"],
          },
        ],
        education: [],
      },
      lineage: {
        sourceResumeVersionId: created.id,
        sourceJobId: "job-123",
      },
    });

    const listed = await repo.listResumeVersionsByProfileId("profile-1");

    expect(listed).toHaveLength(2);
    const versionNumbers = listed.map(
      (version: { versionNumber: number }) => version.versionNumber,
    );
    expect(versionNumbers).toEqual([1, 2]);

    expect(listed[1]).toMatchObject({
      versionNumber: 2,
      kind: "tailored",
      lineage: {
        sourceResumeVersionId: created.id,
        sourceJobId: "job-123",
      },
    });
  });
});
