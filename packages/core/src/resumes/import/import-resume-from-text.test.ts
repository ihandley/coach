import { describe, it, expect } from "vitest";

import { createImportResumeFromText } from "./import-resume-from-text";
import { createCreateResumeProfile } from "../create-resume-profile";
import { createInMemoryResumeProfileRepository } from "../in-memory-resume-profile-repository";
import { createInMemoryResumeVersionRepository } from "../in-memory-resume-version-repository";
import type { NormalizedResume } from "../types";

function makeNormalizedResume(overrides: Partial<NormalizedResume> = {}) {
  return {
    basics: {
      fullName: "Ian Handley",
      headline: "Software Engineer",
      summary: "Builds reliable product systems",
    },
    skills: ["TypeScript", "React"],
    experience: [
      {
        company: "Acme",
        title: "Software Engineer",
        highlights: ["Built reliable import workflows"],
      },
    ],
    education: [],
    ...overrides,
  } satisfies NormalizedResume;
}

function createImportHarness(options?: {
  normalizeResume?: () => Promise<NormalizedResume>;
}) {
  const resumeProfiles = createInMemoryResumeProfileRepository();
  const resumeVersions = createInMemoryResumeVersionRepository();

  const createResumeProfile = createCreateResumeProfile({
    resumeProfiles,
    resumeVersions,
  });

  const normalizeResume =
    options?.normalizeResume ?? (async () => makeNormalizedResume());

  return createImportResumeFromText({
    createResumeProfile,
    normalizeResume,
  });
}

describe("importResumeFromText", () => {
  it("creates a profile from normalized resume text", async () => {
    const importResume = createImportHarness();

    const result = await importResume({
      name: "resume.pdf",
      text: "Software Engineer with experience in TypeScript and React.",
    });

    expect(result.profile.name).toBe("resume.pdf");
  });

  it("creates a baseline version", async () => {
    const importResume = createImportHarness();

    const result = await importResume({
      name: "resume.pdf",
      text: "Software Engineer with experience in TypeScript and React.",
    });

    expect(result.version.kind).toBe("baseline");
    expect(result.version.versionNumber).toBe(1);
    expect(result.version.normalizedResume).toEqual(makeNormalizedResume());
  });

  it("sets currentVersionId to the baseline version", async () => {
    const importResume = createImportHarness();

    const result = await importResume({
      name: "resume.pdf",
      text: "Software Engineer with experience in TypeScript and React.",
    });

    expect(result.profile.currentVersionId).toBe(result.version.id);
  });

  it("stores original PDF filename as source metadata", async () => {
    const importResume = createImportHarness();

    const result = await importResume({
      name: "ian-handley-resume.pdf",
      text: "Software Engineer with experience in TypeScript and React.",
    });

    expect(result.version.source).toEqual({
      kind: "pdf",
      label: "ian-handley-resume.pdf",
    });
  });

  it("throws for empty text", async () => {
    const importResume = createImportHarness();

    await expect(
      importResume({
        name: "resume.pdf",
        text: "   \n\t   ",
      }),
    ).rejects.toThrow("Resume text is empty");
  });

  it("throws cleanly when AI normalization fails", async () => {
    const importResume = createImportHarness({
      normalizeResume: async () => {
        throw new Error("provider unavailable");
      },
    });

    await expect(
      importResume({
        name: "resume.pdf",
        text: "Software Engineer with experience in TypeScript and React.",
      }),
    ).rejects.toThrow("AI resume normalization failed");
  });
});
