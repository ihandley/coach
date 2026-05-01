import { normalizeResumeText } from "./normalizer";
import type { NormalizedResume, ResumeSkillGroup } from "./types";

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
            "Return only JSON with basics{fullName,name,headline?,email,phone?,location?,linkedin?,summary?}, skills:{category,items:string[]}[], experience:{title,company,location?,startDate?,endDate?,bullets:string[]}[], education:{school,degree?,field?,startYear?,endYear?,details:string[]}[], rawText:string.",
            "Extract every resume section present in the source text, including summary, skills, professional experience, and education. Do not drop sections.",
            "Extract the candidate headline from the resume header when present. Extract location and LinkedIn from header/contact metadata.",
            "Preserve skill category groupings such as Languages, Systems, Cloud, or Tools. If skills are not categorized, put them in one Skills category.",
            "For experience, every company/role heading in the source text must become exactly one separate experience[] item.",
            "Headings commonly look like `Company — Title (Start – End)`. In that case company is the text before the dash, title is the text after the dash, and dates come from the parenthesized range.",
            "Do not merge bullets from later companies into earlier companies. Attach each bullet only to the nearest preceding company/role heading.",
            "Preserve all bullet points under the correct job. Do not truncate, summarize, merge jobs, or hallucinate missing facts.",
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
  const parsedFullName = parsed.basics?.fullName ?? parsed.basics?.name;
  const fallbackFullName = fallback.basics.fullName || fallback.basics.name;
  const skills = normalizeParsedSkills(parsed.skills, fallback.skills);

  return {
    basics: {
      fullName: parsedFullName ?? fallbackFullName,
      name: parsedFullName ?? fallbackFullName,
      email: parsed.basics?.email ?? fallback.basics.email,
      ...(parsed.basics?.phone || fallback.basics.phone
        ? { phone: parsed.basics?.phone ?? fallback.basics.phone }
        : {}),
      ...(parsed.basics?.headline || fallback.basics.headline
        ? { headline: parsed.basics?.headline ?? fallback.basics.headline }
        : {}),
      ...(parsed.basics?.location || fallback.basics.location
        ? { location: parsed.basics?.location ?? fallback.basics.location }
        : {}),
      ...(parsed.basics?.linkedin || fallback.basics.linkedin
        ? { linkedin: parsed.basics?.linkedin ?? fallback.basics.linkedin }
        : {}),
      ...(parsed.basics?.summary || fallback.basics.summary
        ? { summary: parsed.basics?.summary ?? fallback.basics.summary }
        : {}),
    },
    skills,
    experience: Array.isArray(parsed.experience)
      ? parsed.experience
      : fallback.experience,
    education: Array.isArray(parsed.education)
      ? parsed.education
      : fallback.education,
    rawText,
  };
}

function normalizeParsedSkills(
  parsedSkills: unknown,
  fallbackSkills: ResumeSkillGroup[],
): ResumeSkillGroup[] {
  if (!Array.isArray(parsedSkills)) {
    return fallbackSkills;
  }

  if (parsedSkills.every((skill) => typeof skill === "string")) {
    return [
      {
        category: "Skills",
        items: parsedSkills.filter((skill): skill is string => typeof skill === "string"),
      },
    ];
  }

  const groups = parsedSkills
    .map((skill) => {
      if (!skill || typeof skill !== "object") {
        return null;
      }

      const candidate = skill as { category?: unknown; items?: unknown };
      const items = Array.isArray(candidate.items)
        ? candidate.items.filter((item): item is string => typeof item === "string")
        : [];

      if (items.length === 0) {
        return null;
      }

      return {
        category:
          typeof candidate.category === "string" && candidate.category.trim()
            ? candidate.category.trim()
            : "Skills",
        items,
      };
    })
    .filter((skill): skill is ResumeSkillGroup => Boolean(skill));

  return groups.length > 0 ? groups : fallbackSkills;
}
