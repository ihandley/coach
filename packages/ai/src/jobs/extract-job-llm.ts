
import OpenAI from "openai";
import type { ExtractedJobData, FetchedJobPage } from "@coach/core";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function extractJobWithLLM(
  input: FetchedJobPage,
): Promise<ExtractedJobData | null> {
  try {
    console.log("🧠 LLM called for:", input.url);
    const html = input.html.slice(0, 15000); // prevent huge payloads

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Extract structured job posting data. Return strict JSON only.",
        },
        {
          role: "user",
          content: `
Extract:
- title
- company
- description

Rules:
- Clean title (no 'LinkedIn hiring...' etc)
- Extract real company name
- Return full readable description
- No markdown
- No commentary

HTML:
${html}
`,
        },
      ],
    });

    const text = res.choices[0]?.message?.content ?? "";

    const parsed = JSON.parse(text);
    console.log("✅ LLM success:", parsed.title);

    if (!parsed.title || !parsed.description) return null;

    return {
      title: parsed.title,
      company: parsed.company ?? "Unknown",
      rawDescription: parsed.description,
    };
  } catch (err) {
    console.error("LLM extraction failed", err);
    return null;
  }
}
