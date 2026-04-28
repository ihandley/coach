import { describe, expect, it } from "vitest";

import { createDbReviewCurrentResumeProfile } from "./create-db-review-current-resume-profile";

describe("createDbReviewCurrentResumeProfile", () => {
    it("reviews the current stored resume version using db repositories", async () => {
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
                    summary: "Builds reliable product systems with TypeScript and React.",
                },
                skills: ["TypeScript", "React", "Node.js"],
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
                                    if (column !== "id" || operator !== "=") {
                                        throw new Error("Unexpected profile query");
                                    }

                                    return {
                                        executeTakeFirst: async () =>
                                            resumeProfiles.get(value) ?? undefined,
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
                                        executeTakeFirst: async () =>
                                            resumeVersions.get(value) ?? undefined,
                                    };
                                },
                            };
                        },
                    };
                }

                throw new Error(`Unexpected table: ${table}`);
            },
        };

        const reviewCurrentResumeProfile = createDbReviewCurrentResumeProfile({ db });

        const result = await reviewCurrentResumeProfile({
            resumeProfileId: "profile-1",
        });

        expect(result).toMatchObject({
            resumeProfileId: "profile-1",
            resumeVersionId: "version-1",
            review: {
                coreStrengths: expect.any(Array),
                missingSignals: expect.any(Array),
                concerns: expect.any(Array),
                targetRoleAlignment: expect.any(Array),
                recommendedImprovements: expect.any(Array),
            },
        });
    });
});