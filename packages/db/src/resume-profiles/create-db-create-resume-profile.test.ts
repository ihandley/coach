import { describe, expect, it } from "vitest";

import { createDbCreateResumeProfile } from "./create-db-create-resume-profile.ts";

describe("createDbCreateResumeProfile", () => {
    it("creates a resume profile and initial version using db repositories", async () => {
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

        const db = {
            insertInto(table: string) {
                if (table === "resume_profiles") {
                    return {
                        values(input: {
                            id?: string;
                            name: string;
                            current_version_id: string;
                        }) {
                            const row = {
                                id: input.id ?? crypto.randomUUID(),
                                name: input.name,
                                current_version_id: input.current_version_id,
                            };

                            resumeProfiles.set(row.id, row);

                            return {
                                returningAll() {
                                    return {
                                        executeTakeFirstOrThrow: async () => row,
                                    };
                                },
                            };
                        },
                    };
                }

                if (table === "resume_versions") {
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
                }

                throw new Error(`Unexpected table: ${table}`);
            },
        };

        const createResumeProfile = createDbCreateResumeProfile({ db });

        const result = await createResumeProfile({
            name: "Baseline Resume",
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

        expect(result.profile).toMatchObject({
            id: expect.any(String),
            name: "Baseline Resume",
            currentVersionId: expect.any(String),
        });

        expect(result.version).toMatchObject({
            id: expect.any(String),
            profileId: result.profile.id,
            versionNumber: 1,
            source: {
                kind: "manual",
                label: "baseline-resume",
            },
        });

        expect(result.profile.currentVersionId).toBe(result.version.id);
    });
});