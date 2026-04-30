import { describe, expect, it } from "vitest";

import { extractGmailUpdate } from "./extract-gmail-update";

describe("extractGmailUpdate", () => {
    it("extracts an interview signal", () => {
        const result = extractGmailUpdate({
            subject: "Interview with Acme",
            snippet: "We would like to schedule an interview with the team.",
        });

        expect(result).toMatchObject({
            status: "interviewing",
            note: "We would like to schedule an interview with the team.",
        });
    });

    it("extracts a rejection signal", () => {
        const result = extractGmailUpdate({
            subject: "Update on your application",
            snippet: "We have decided not to move forward at this time.",
        });

        expect(result).toMatchObject({
            status: "rejected",
            note: "We have decided not to move forward at this time.",
        });
    });

    it("returns null when no supported signal is found", () => {
        const result = extractGmailUpdate({
            subject: "Thanks for applying",
            snippet: "We received your application.",
        });

        expect(result).toBeNull();
    });
});
