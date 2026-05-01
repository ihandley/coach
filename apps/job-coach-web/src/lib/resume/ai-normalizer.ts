import { normalizeResumeText } from "./normalizer";
import type { NormalizedResume } from "./types";

export function isAiResumeNormalizerEnabled() {
  return process.env.RESUME_AI_NORMALIZER_ENABLED === "true";
}

export async function normalizeResumeWithAi(
  rawText: string,
): Promise<NormalizedResume | null> {
  if (!isAiResumeNormalizerEnabled()) {
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: process.env.RESUME_AI_NORMALIZER_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          [
            "Return only JSON with basics{name,email,phone?}, skills:string[], experience:{title,company,location?,startDate?,endDate?,bullets:string[]}[], education:{school,degree?,field?,startYear?,endYear?,details:string[]}[], rawText:string.",
            "For experience, every company/role heading in the source text must become exactly one separate experience[] item.",
            "Headings commonly look like `Company — Title (Start – End)`. In that case company is the text before the dash, title is the text after the dash, and dates come from the parenthesized range.",
            "Do not merge bullets from later companies into earlier companies. Attach each bullet only to the nearest preceding company/role heading.",
            "For education, every school line must become a separate education[] item. Do not merge multiple schools into one education entry.",
          ].join(" "),
      },
      {
        role: "user",
        content: rawText,
      },
    ],
  });

  const content = response.choices[0]?.message.content;

  if (!content) {
    throw new Error("AI resume normalization returned no content");
  }

  const parsed = JSON.parse(content) as Partial<NormalizedResume>;
  const fallback = normalizeResumeText(rawText);

  return {
    basics: {
      name: parsed.basics?.name ?? fallback.basics.name,
      email: parsed.basics?.email ?? fallback.basics.email,
      ...(parsed.basics?.phone || fallback.basics.phone
        ? { phone: parsed.basics?.phone ?? fallback.basics.phone }
        : {}),
    },
    skills: Array.isArray(parsed.skills) ? parsed.skills : fallback.skills,
    experience: Array.isArray(parsed.experience)
      ? parsed.experience
      : fallback.experience,
    education: Array.isArray(parsed.education)
      ? parsed.education
      : fallback.education,
    rawText,
  };
}
