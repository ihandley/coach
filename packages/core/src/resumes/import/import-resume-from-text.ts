import type { CreateResumeProfile } from "../create-resume-profile";

type ImportResumeFromTextInput = {
  name: string;
  text: string;
};

export function createImportResumeFromText(deps: {
  createResumeProfile: CreateResumeProfile;
}) {
  const { createResumeProfile } = deps;

  return async function importResumeFromText(
    input: ImportResumeFromTextInput
  ) {
    const normalizedResume = {
      basics: {
        fullName: "",
        headline: "",
        summary: input.text.slice(0, 500), // temporary placeholder
      },
      skills: [],
      experience: [],
      education: [],
      rawText: input.text,
    };

    return createResumeProfile({
      name: input.name,
      source: {
        kind: "import",
        label: "text-import",
      },
      normalizedResume,
    });
  };
}
