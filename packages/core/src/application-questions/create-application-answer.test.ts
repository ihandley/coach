import { describe, expect, it } from "vitest";

import { createApplicationAnswer } from "./create-application-answer";

describe("createApplicationAnswer", () => {
    it("creates an application answer from question, resume context, and job context", async () => {
        const result = await createApplicationAnswer({
            question: "Why are you interested in this role?",
            candidateName: "Ian Handley",
            companyName: "Acme",
            jobTitle: "Senior Software Engineer",
            jobSummary:
                "Build product features, collaborate across teams, and improve developer experience.",
            resumeSummary:
                "Software engineer with experience building web applications, APIs, and internal tools.",
        });

        expect(result.answer).toEqual(expect.any(String));
        expect(result.answer).toContain("Acme");
        expect(result.answer).toContain("Senior Software Engineer");
        expect(result.answer.length).toBeGreaterThan(0);
    });
});