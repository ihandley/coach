import type { CreateResumeProfile } from "../create-resume-profile";
import type { NormalizedResume } from "../types";

export type NormalizeResume = (text: string) => Promise<NormalizedResume>;

type ImportResumeFromTextInput = {
  name: string;
  text: string;
};

function assertNormalizedResume(value: NormalizedResume) {
  if (!value || typeof value !== "object") {
    throw new Error("AI resume normalization returned invalid output");
  }

  if (!value.basics || typeof value.basics !== "object") {
    throw new Error("AI resume normalization returned invalid basics");
  }

  if (
    typeof value.basics.fullName !== "string" ||
    typeof value.basics.headline !== "string" ||
    typeof value.basics.summary !== "string"
  ) {
    throw new Error("AI resume normalization returned invalid basics");
  }

  if (
    !Array.isArray(value.skills) ||
    !Array.isArray(value.experience) ||
    !Array.isArray(value.education)
  ) {
    throw new Error("AI resume normalization returned invalid sections");
  }
}

export function createImportResumeFromText(deps: {
  createResumeProfile: CreateResumeProfile;
  normalizeResume: NormalizeResume;
}) {
  const { createResumeProfile, normalizeResume } = deps;

  return async function importResumeFromText(input: ImportResumeFromTextInput) {
    const text = input.text.trim();

    if (!text) {
      throw new Error("Resume text is empty");
    }

    let normalizedResume: NormalizedResume;

    try {
      normalizedResume = await normalizeResume(text);
    } catch (error) {
      throw new Error("AI resume normalization failed", { cause: error });
    }

    assertNormalizedResume(normalizedResume);

    return createResumeProfile({
      name: input.name,
      source: {
        kind: "pdf",
        label: input.name,
      },
      normalizedResume,
    });
  };
}
