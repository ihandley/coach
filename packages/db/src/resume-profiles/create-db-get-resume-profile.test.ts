import { describe, expect, it } from "vitest";

import { createDbGetResumeProfile } from "./create-db-get-resume-profile";

describe("createDbGetResumeProfile", () => {
  it("returns a resume profile and its current version using db repositories", async () => {
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
      current_version_id: "version-2",
    });

    resumeVersions.set("version-2", {
      id: "version-2",
      profile_id: "profile-1",
      version_number: 2,
      source_kind: "manual",
      source_label: "baseline-resume-v2",
      normalized_resume: {
        basics: {
          fullName: "Ian Handley",
          headline: "Senior Software Engineer",
          summary: "Builds reliable product systems and leads delivery",
        },
        skills: ["TypeScript", "React", "Node.js"],
        experience: [],
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
                  if (column !== "id" || operator !== "=") {
                    throw new Error("Unexpected profile query");
                  }

                  return {
                    executeTakeFirst: async () => resumeProfiles.get(value) ?? undefined,
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
                  if (column !== "id" || operator !== "=") {
                    throw new Error("Unexpected version query");
                  }

                  return {
                    executeTakeFirst: async () => resumeVersions.get(value) ?? undefined,
                  };
                },
              };
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    };

    const getResumeProfile = createDbGetResumeProfile({ db });

    const result = await getResumeProfile({
      resumeProfileId: "profile-1",
    });

    expect(result).toMatchObject({
      profile: {
        id: "profile-1",
        name: "Baseline Resume",
        currentVersionId: "version-2",
      },
      currentVersion: {
        id: "version-2",
        profileId: "profile-1",
        versionNumber: 2,
      },
    });
  });
});
