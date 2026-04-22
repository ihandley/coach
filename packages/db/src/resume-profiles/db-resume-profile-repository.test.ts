import { describe, expect, it } from "vitest";

import { DbResumeProfileRepository } from "./db-resume-profile-repository";

describe("DbResumeProfileRepository", () => {
    it("returns a resume profile by id", async () => {
        const db = {
            resumeProfile: {
                async findUnique(args: { where: { id: string } }) {
                    if (args.where.id !== "resume-123") {
                        return null;
                    }

                    return {
                        id: "resume-123",
                        name: "Baseline Resume",
                    };
                },
            },
        };

        const repository = new DbResumeProfileRepository(db);

        await expect(
            repository.getResumeProfileById("resume-123"),
        ).resolves.toEqual({
            id: "resume-123",
            name: "Baseline Resume",
        });
    });

    it("returns null when the resume profile does not exist", async () => {
        const db = {
            resumeProfile: {
                async findUnique() {
                    return null;
                },
            },
        };

        const repository = new DbResumeProfileRepository(db);

        await expect(
            repository.getResumeProfileById("missing-resume"),
        ).resolves.toBeNull();
    });
});