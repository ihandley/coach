import { describe, expect, it } from "vitest";

import { formatJobUpdatedDate, sortJobsByUpdatedDate } from "./jobs-page-model";

describe("jobs page model", () => {
    it("formats updated dates", () => {
        expect(formatJobUpdatedDate("2026-04-23T10:00:00.000Z")).toBe("2026-04-23");
    });

    it("sorts jobs by most recently updated first", () => {
        const jobs = sortJobsByUpdatedDate([
            {
                id: "job-1",
                company: "OldCo",
                title: "Old Job",
                status: "saved",
                updatedAt: "2026-04-20T10:00:00.000Z",
            },
            {
                id: "job-2",
                company: "NewCo",
                title: "New Job",
                status: "saved",
                updatedAt: "2026-04-23T10:00:00.000Z",
            },
        ]);

        expect(jobs[0]?.company).toBe("NewCo");
        expect(jobs[1]?.company).toBe("OldCo");
    });

    it("keeps stable order for equal timestamps", () => {
        const jobs = sortJobsByUpdatedDate([
            {
                id: "job-1",
                company: "A",
                title: "A",
                status: "saved",
                updatedAt: "2026-04-23T10:00:00.000Z",
            },
            {
                id: "job-2",
                company: "B",
                title: "B",
                status: "saved",
                updatedAt: "2026-04-23T10:00:00.000Z",
            },
        ]);

        expect(jobs[0]?.id).toBe("job-1");
        expect(jobs[1]?.id).toBe("job-2");
    });
});
