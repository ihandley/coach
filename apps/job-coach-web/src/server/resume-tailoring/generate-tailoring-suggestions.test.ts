import { describe, expect, it } from "vitest";

import { generateResumeTailoringSuggestions } from "./generate-tailoring-suggestions";
import type { NormalizedResume } from "@coach/core";

const baseResume: NormalizedResume = {
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

function makeResume(overrides: Partial<NormalizedResume> = {}): NormalizedResume {
  return {
    ...baseResume,
    ...overrides,
    basics: {
      ...baseResume.basics,
      ...overrides.basics,
    },
  };
}

function generateExperienceSuggestions(sourceResume: NormalizedResume) {
  return generateResumeTailoringSuggestions({
    sourceResume,
    job: {
      title: "Staff Software Engineer",
      company: "Pattern",
      sourceText: "Build distributed backend systems for massive data flows.",
    },
  }).filter((suggestion) => suggestion.sectionTarget === "experience");
}

describe("generateResumeTailoringSuggestions", () => {
  it("returns deterministic suggestions for Pattern Predict gaps", () => {
    const suggestions = generateResumeTailoringSuggestions({
      sourceResume: baseResume,
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

  it("uses experience highlights as original content when they are present", () => {
    const suggestions = generateExperienceSuggestions(baseResume);

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "suggestion-distributed-data-systems",
          originalContent:
            "Led React and TypeScript workflows for customer success teams. Designed Node.js backend services and PostgreSQL schemas.",
        }),
      ]),
    );
  });

  it("falls back to other experience text when highlights are missing", () => {
    const resumeWithoutHighlights = makeResume({
      experience: [
        {
          company: "Northstar Product Labs",
          title: "Senior Software Engineer",
          description: "Owned resilient backend services for customer workflows.",
        },
      ],
    } as unknown as Partial<NormalizedResume>);

    const suggestions = generateExperienceSuggestions(resumeWithoutHighlights);

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "suggestion-distributed-data-systems",
          originalContent: "Owned resilient backend services for customer workflows.",
        }),
      ]),
    );
  });

  it("falls back to the resume summary when experience is missing", () => {
    const resumeWithoutExperience = makeResume({
      experience: undefined,
    } as unknown as Partial<NormalizedResume>);

    const suggestions = generateExperienceSuggestions(resumeWithoutExperience);

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "suggestion-distributed-data-systems",
          originalContent: baseResume.basics.summary,
        }),
      ]),
    );
  });

  it("does not crash when the resume is malformed or minimal", () => {
    const malformedResume = {
      basics: {},
      skills: undefined,
      experience: [null, "not an experience", { highlights: undefined }],
      education: undefined,
    } as unknown as NormalizedResume;

    const suggestions = generateResumeTailoringSuggestions({
      sourceResume: malformedResume,
      job: {
        title: "Staff Software Engineer",
        company: "Pattern",
        sourceText:
          "Build marketplace integrations, distributed backend systems, database design, and data modeling.",
      },
    });

    expect(suggestions.map((suggestion) => suggestion.id)).toEqual(
      expect.arrayContaining([
        "suggestion-marketplace-integrations",
        "suggestion-distributed-data-systems",
        "suggestion-database-design-data-modeling",
      ]),
    );
    expect(
      suggestions.every(
        (suggestion) =>
          typeof suggestion.originalContent === "string" &&
          typeof suggestion.suggestedContent === "string",
      ),
    ).toBe(true);
  });
});
