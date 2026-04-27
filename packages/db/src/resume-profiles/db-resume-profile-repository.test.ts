import { describe, expect, it } from "vitest";

import { createDbResumeProfileRepository } from "./db-resume-profile-repository";

describe("createDbResumeProfileRepository", () => {
    it("creates and retrieves a resume profile", async () => {
        const rows = new Map<string, {
            id: string;
            name: string;
            current_version_id: string;
            created_at: string;
        }>();

        const db = {
            from(table: string) {
                expect(table).toBe("resume_profiles");

                return {
                    insert(input: any) {
                        const row = {
                            id: input.id ?? crypto.randomUUID(),
                            name: input.name,
                            current_version_id: input.current_version_id,
                            created_at: new Date().toISOString(),
                        };

                        rows.set(row.id, row);

                        return {
                            select() {
                                return {
                                    single: async () => ({ data: row, error: null }),
                                };
                            },
                        };
                    },

                    select() {
                        return {
                            eq(column: string, value: string) {
                                expect(column).toBe("id");

                                return {
                                    single: async () => ({
                                        data: rows.get(value) ?? null,
                                        error: rows.has(value)
                                            ? null
                                            : { code: "PGRST116" },
                                    }),
                                };
                            },
                        };
                    },

                    update(input: any) {
                        return {
                            eq(column: string, value: string) {
                                expect(column).toBe("id");

                                return {
                                    select() {
                                        return {
                                            single: async () => {
                                                const existing = rows.get(value);

                                                if (!existing) {
                                                    return {
                                                        data: null,
                                                        error: { code: "PGRST116" },
                                                    };
                                                }

                                                const updated = {
                                                    ...existing,
                                                    current_version_id: input.current_version_id,
                                                };

                                                rows.set(value, updated);

                                                return {
                                                    data: updated,
                                                    error: null,
                                                };
                                            },
                                        };
                                    },
                                };
                            },
                        };
                    },

                    order() {
                        return {
                            then: async () => ({
                                data: Array.from(rows.values()),
                                error: null,
                            }),
                        };
                    },
                };
            },
        };

        const repo = createDbResumeProfileRepository({ db: db as any });

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
