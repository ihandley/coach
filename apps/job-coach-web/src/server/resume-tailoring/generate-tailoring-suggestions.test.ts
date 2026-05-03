import { describe, expect, it } from "vitest";

import { generateResumeTailoringSuggestions } from "./generate-tailoring-suggestions";
import type { NormalizedResume } from "@coach/core";

const resume: NormalizedResume = {
  basics: {
    fullName: "Jordan Lee",
    headline: "Senior Software Engineer",
    summary:
      "Senior software engineer with React, TypeScript, Node.js, PostgreSQL, and cloud backend experience.",
  },
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Backend services"],
  experience: [
    {
      company: "Northstar Product Labs",
      title: "Senior Software Engineer",
      highlights: [
        "Led React and TypeScript workflows for customer success teams.",
        "Designed Node.js backend services and PostgreSQL schemas.",
      ],
    },
  ],
  education: [],
};

describe("generateResumeTailoringSuggestions", () => {
  it("returns deterministic suggestions for Pattern Predict gaps", () => {
    const suggestions = generateResumeTailoringSuggestions({
      sourceResume: resume,
      job: {
        title: "Staff Software Engineer, Predict",
        company: "Pattern",
        sourceText:
          "Build marketplace integrations, distributed backend systems, massive data flows, database design, data modeling, and partner success workflows.",
      },
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.map((suggestion) => suggestion.id)).toEqual(
      expect.arrayContaining([
        "suggestion-marketplace-integrations",
        "suggestion-distributed-data-systems",
        "suggestion-database-design-data-modeling",
      ]),
    );
    expect(suggestions[0]).toEqual(
      expect.objectContaining({
        sectionTarget: expect.any(String),
        originalContent: expect.any(String),
        suggestedContent: expect.any(String),
        rationale: expect.any(String),
        relatedJobRequirements: expect.any(Array),
        priority: expect.stringMatching(/^(low|medium|high)$/),
        confidence: expect.stringMatching(/^(low|medium|high)$/),
      }),
    );
  });
});
