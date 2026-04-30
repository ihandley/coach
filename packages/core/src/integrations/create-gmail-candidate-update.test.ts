import { describe, expect, it } from "vitest";

import { createGmailCandidateUpdate } from "./create-gmail-candidate-update.ts";

describe("createGmailCandidateUpdate", () => {
    it("creates a candidate update when a message matches a job and contains a supported signal", () => {
        const result = createGmailCandidateUpdate({
            message: {
                id: "msg-1",
                subject: "Interview with Acme",
                from: "recruiter@acme.com",
                snippet: "We would like to schedule an interview with the team.",
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

        expect(result).toMatchObject({
            jobId: "job-1",
            messageId: "msg-1",
            status: "interviewing",
            note: "We would like to schedule an interview with the team.",
        });
    });

    it("returns null when the message does not match a job", () => {
        const result = createGmailCandidateUpdate({
            message: {
                id: "msg-1",
                subject: "Interview with UnknownCo",
                from: "recruiter@unknown.com",
                snippet: "We would like to schedule an interview with the team.",
                receivedAt: "2026-04-23T10:00:00.000Z",
            },
            jobs: [],
        });

        expect(result).toBeNull();
    });

    it("returns null when the message matches a job but has no supported signal", () => {
        const result = createGmailCandidateUpdate({
            message: {
                id: "msg-1",
                subject: "Thanks for applying to Acme",
                from: "recruiter@acme.com",
                snippet: "We received your application.",
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

        expect(result).toBeNull();
    });
});
