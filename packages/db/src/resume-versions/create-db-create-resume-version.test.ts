import { describe, expect, it } from "vitest";

import { createDbCreateResumeVersion } from "./create-db-create-resume-version";

describe("createDbCreateResumeVersion", () => {
  it("creates the next resume version and updates the profile current version", async () => {
    const resumeProfiles = new Map<
      string,
      {
        id: string;
        name: string;
        current_version_id: string;
      }
    >();

    const resumeVersions = new Map<
      string,
      {
        id: string;
        profile_id: string;
        version_number: number;
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
      }
    >();

    resumeProfiles.set("profile-1", {
      id: "profile-1",
      name: "Baseline Resume",
      current_version_id: "version-1",
    });

    resumeVersions.set("version-1", {
      id: "version-1",
      profile_id: "profile-1",
      version_number: 1,
      source_kind: "manual",
      source_label: "baseline-resume",
      normalized_resume: {
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

    const db = {
      selectFrom(table: string) {
        if (table === "resume_profiles") {
          return {
            selectAll() {
              return {
                where(column: string, operator: string, value: string) {
                  return {
                    executeTakeFirst: async () => {
                      if (column !== "id" || operator !== "=") {
                        throw new Error("Unexpected profile lookup");
                      }

                      return resumeProfiles.get(value) ?? undefined;
                    },
                  };
                },
              };
            },
          };
        }

        if (table === "resume_versions") {
          return {
            selectAll() {
              return {
                where(column: string, operator: string, value: string) {
                  if (column === "id") {
                    return {
                      executeTakeFirst: async () => resumeVersions.get(value) ?? undefined,
                    };
                  }

                  if (column === "profile_id") {
                    return {
                      orderBy(orderColumn: string, direction: string) {
                        if (
                          operator !== "=" ||
                          orderColumn !== "version_number" ||
                          direction !== "asc"
                        ) {
                          throw new Error("Unexpected version list query");
                        }

                        return {
                          execute: async () =>
                            Array.from(resumeVersions.values())
                              .filter((row) => row.profile_id === value)
                              .sort((a, b) => a.version_number - b.version_number),
                        };
                      },
                    };
                  }

                  throw new Error("Unexpected version lookup");
                },
              };
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },

      insertInto(table: string) {
        if (table !== "resume_versions") {
          throw new Error(`Unexpected insert table: ${table}`);
        }

        return {
          values(input: {
            id?: string;
            profile_id: string;
            version_number: number;
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
          }) {
            const row = {
              id: input.id ?? crypto.randomUUID(),
              profile_id: input.profile_id,
              version_number: input.version_number,
              source_kind: input.source_kind,
              source_label: input.source_label,
              normalized_resume: input.normalized_resume,
            };

            resumeVersions.set(row.id, row);

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

      updateTable(table: string) {
        if (table !== "resume_profiles") {
          throw new Error(`Unexpected update table: ${table}`);
        }

        return {
          set(input: { current_version_id: string }) {
            return {
              where(column: string, operator: string, value: string) {
                return {
                  returningAll() {
                    return {
                      executeTakeFirst: async () => {
                        if (column !== "id" || operator !== "=") {
                          throw new Error("Unexpected profile update");
                        }

                        const existing = resumeProfiles.get(value);

                        if (!existing) {
                          return undefined;
                        }

                        const updated = {
                          ...existing,
                          current_version_id: input.current_version_id,
                        };

                        resumeProfiles.set(value, updated);
                        return updated;
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    };

    const createResumeVersion = createDbCreateResumeVersion({ db });

    const result = await createResumeVersion({
      resumeProfileId: "profile-1",
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
    });

    expect(result).toMatchObject({
      id: expect.any(String),
      profileId: "profile-1",
      versionNumber: 2,
      source: {
        kind: "manual",
        label: "baseline-resume-v2",
      },
    });

    expect(resumeProfiles.get("profile-1")?.current_version_id).toBe(result.id);
  });
});
