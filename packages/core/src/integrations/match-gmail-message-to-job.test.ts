import { describe, expect, it } from "vitest";

import { matchGmailMessageToJob } from "./match-gmail-message-to-job";

describe("matchGmailMessageToJob", () => {
    it("matches a message to a job by company name in subject", () => {
        const result = matchGmailMessageToJob({
            message: {
                id: "msg-1",
                subject: "Interview with Acme",
                from: "recruiter@acme.com",
                snippet: "We would like to schedule an interview",
                receivedAt: "2026-04-23T10:00:00.000Z",
            },
            jobs: [
                {
                    id: "job-1",
                    company: "Acme",
                    title: "Engineer",
                    sourceUrl: "",
                    sourceText: "",
                    status: "applied",
                    createdAt: "",
                    updatedAt: "",
                },
            ],
        });

        expect(result?.jobId).toBe("job-1");
    });

    it("returns null when no job matches", () => {
        const result = matchGmailMessageToJob({
            message: {
                id: "msg-1",
                subject: "Interview with UnknownCo",
                from: "recruiter@unknown.com",
                snippet: "",
                receivedAt: "",
            },
            jobs: [],
        });

        expect(result).toBeNull();
    });
});
