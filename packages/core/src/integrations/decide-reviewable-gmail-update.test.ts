import { describe, expect, it } from "vitest";

import { decideReviewableGmailUpdate } from "./decide-reviewable-gmail-update";

describe("decideReviewableGmailUpdate", () => {
    it("marks a reviewable update as accepted", () => {
        const result = decideReviewableGmailUpdate({
            jobId: "job-1",
            messageId: "msg-1",
            status: "interviewing",
            note: "We would like to schedule an interview.",
            decision: "pending",
        }, "accepted");

        expect(result).toMatchObject({
            jobId: "job-1",
            messageId: "msg-1",
            status: "interviewing",
            note: "We would like to schedule an interview.",
            decision: "accepted",
        });
    });

    it("marks a reviewable update as rejected", () => {
        const result = decideReviewableGmailUpdate({
            jobId: "job-1",
            messageId: "msg-1",
            status: "rejected",
            note: "We have decided not to move forward.",
            decision: "pending",
        }, "rejected");

        expect(result).toMatchObject({
            decision: "rejected",
        });
    });
});
