import { describe, expect, it } from "vitest";

import { createDbResumeProfileRepository } from "./db-resume-profile-repository";

describe("createDbResumeProfileRepository", () => {
    it("creates and retrieves a resume profile", async () => {
        const rows = new Map<string, {
            id: string;
            name: string;
            current_version_id: string;
        }>();

        const db = {
            insertInto(table: string) {
                expect(table).toBe("resume_profiles");

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
                expect(table).toBe("resume_profiles");

                return {
                    selectAll() {
                        return {
                            where(column: string, operator: string, value: string) {
                                expect(column).toBe("id");
                                expect(operator).toBe("=");

                                return {
                                    executeTakeFirst: async () => rows.get(value) ?? undefined,
                                };
                            },
                        };
                    },
                };
            },

            updateTable(table: string) {
                expect(table).toBe("resume_profiles");

                return {
                    set(input: { current_version_id: string }) {
                        return {
                            where(column: string, operator: string, value: string) {
                                expect(column).toBe("id");
                                expect(operator).toBe("=");

                                return {
                                    returningAll() {
                                        return {
                                            executeTakeFirst: async () => {
                                                const existing = rows.get(value);

                                                if (!existing) {
                                                    return undefined;
                                                }

                                                const updated = {
                                                    ...existing,
                                                    current_version_id: input.current_version_id,
                                                };

                                                rows.set(value, updated);
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

        const repo = createDbResumeProfileRepository({ db });

        const created = await repo.createResumeProfile({
            name: "Baseline Resume",
            currentVersionId: "resume-version-1",
        });

        expect(created).toMatchObject({
            id: expect.any(String),
            name: "Baseline Resume",
            currentVersionId: "resume-version-1",
        });

        const fetched = await repo.getResumeProfileById(created.id);

        expect(fetched).toEqual(created);

        const updated = await repo.updateResumeProfileCurrentVersion({
            resumeProfileId: created.id,
            currentVersionId: "resume-version-2",
        });

        expect(updated).toMatchObject({
            id: created.id,
            name: "Baseline Resume",
            currentVersionId: "resume-version-2",
        });
    });
});