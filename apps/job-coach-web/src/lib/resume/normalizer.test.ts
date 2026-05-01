import { describe, expect, it } from "vitest";

import { normalizeResumeText } from "./normalizer";

describe("normalizeResumeText", () => {
  it("always returns a valid structured resume", () => {
    const result = normalizeResumeText(`Ian Handley
ian@example.com
(555) 123-4567

Skills
TypeScript, React, SQL

Experience
Senior Engineer at Acme
- Built hiring tools

Education
University of Utah - BS Computer Science`);

    expect(result).toEqual({
      basics: {
        name: "Ian Handley",
        email: "ian@example.com",
        phone: "(555) 123-4567",
      },
      skills: expect.arrayContaining(["TypeScript", "React", "SQL"]),
      experience: [
        {
          title: "Senior Engineer",
          company: "Acme",
          bullets: ["Built hiring tools"],
        },
      ],
      education: [
        {
          school: "University of Utah",
          degree: "BS Computer Science",
          details: [],
        },
      ],
      rawText: expect.stringContaining("Ian Handley"),
    });
  });

  it("returns empty arrays and string fields when text has no sections", () => {
    expect(normalizeResumeText("")).toEqual({
      basics: {
        name: "",
        email: "",
      },
      skills: [],
      experience: [],
      education: [],
      rawText: "",
    });
  });
});
