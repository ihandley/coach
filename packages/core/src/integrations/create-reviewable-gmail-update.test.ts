import { describe, expect, it } from "vitest";

import { createReviewableGmailUpdate } from "./create-reviewable-gmail-update.ts";

describe("createReviewableGmailUpdate", () => {
    it("wraps a Gmail candidate update with review metadata", () => {
        const result = createReviewableGmailUpdate({
            jobId: "job-1",
            messageId: "msg-1",
            status: "interviewing",
            note: "We would like to schedule an interview.",
        });

        expect(result).toMatchObject({
            jobId: "job-1",
            messageId: "msg-1",
            status: "interviewing",
            note: "We would like to schedule an interview.",
            decision: "pending",
        });
    });
});
