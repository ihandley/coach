import { describe, expect, it } from "vitest";

import { createBaselineResumeReview } from "./create-baseline-resume-review";

describe("createBaselineResumeReview", () => {
    it("returns structured baseline review output from normalized resume data", async () => {
        const review = await createBaselineResumeReview({
            basics: {
                fullName: "Ian Handley",
                headline: "Software Engineer",
                summary: "Builds reliable product systems with TypeScript and React.",
            },
            skills: ["TypeScript", "React", "Node.js"],
            experience: [
                {
                    company: "Acme",
                    title: "Software Engineer",
                    highlights: [
                        "Built internal tools used by support teams",
                        "Improved developer workflows",
                    ],
                },
            ],
            education: [],
        });

        expect(review).toMatchObject({
            coreStrengths: expect.any(Array),
            missingSignals: expect.any(Array),
            concerns: expect.any(Array),
            targetRoleAlignment: expect.any(Array),
            recommendedImprovements: expect.any(Array),
        });
    });

    it("flags missing summary and missing skills as improvement opportunities", async () => {
        const review = await createBaselineResumeReview({
            basics: {
                fullName: "Ian Handley",
                headline: "",
                summary: "",
            },
            skills: [],
            experience: [
                {
                    company: "Acme",
                    title: "Software Engineer",
                    highlights: [],
                },
            ],
            education: [],
        });

        expect(review.missingSignals).toContain("Missing a professional headline.");
        expect(review.concerns).toContain("No professional summary is present.");
        expect(review.missingSignals).toContain("No skills section is present.");
        expect(review.concerns).toContain(
            "Experience entries do not include bullet-level highlights.",
        );

        expect(review.recommendedImprovements).toContain(
            "Add a clear target-role headline.",
        );
        expect(review.recommendedImprovements).toContain(
            "Add a concise summary highlighting strengths and direction.",
        );
        expect(review.recommendedImprovements).toContain(
            "Add a skills section with relevant tools and technologies.",
        );
        expect(review.recommendedImprovements).toContain(
            "Add bullet points describing outcomes, scope, and impact.",
        );
    });
});