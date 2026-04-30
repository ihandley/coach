import { describe, expect, it } from "vitest";

import { createApplicationEventsFromGmailUpdate } from "./create-application-events-from-gmail-update.ts";

describe("createApplicationEventsFromGmailUpdate", () => {
    it("creates status and note events for an interviewing update", () => {
        const result = createApplicationEventsFromGmailUpdate({
            jobId: "job-1",
            messageId: "msg-1",
            status: "interviewing",
            note: "We would like to schedule an interview with the team.",
        });

        expect(result).toEqual([
            {
                jobId: "job-1",
                type: "status_changed",
                note: "gmail:msg-1 status -> interviewing",
            },
            {
                jobId: "job-1",
                type: "note_added",
                note: "gmail:msg-1 We would like to schedule an interview with the team.",
            },
        ]);
    });

    it("creates status and note events for a rejection update", () => {
        const result = createApplicationEventsFromGmailUpdate({
            jobId: "job-1",
            messageId: "msg-2",
            status: "rejected",
            note: "We have decided not to move forward at this time.",
        });

        expect(result).toEqual([
            {
                jobId: "job-1",
                type: "status_changed",
                note: "gmail:msg-2 status -> rejected",
            },
            {
                jobId: "job-1",
                type: "note_added",
                note: "gmail:msg-2 We have decided not to move forward at this time.",
            },
        ]);
    });
});
