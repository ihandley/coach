import OpenAI from "openai";

type StructuredJobSummary = {
  location: string | null;
  salaryRange: string | null;
  companyInfo: string[];
  jobDescription: string[];
  requirements: string[];
  benefits: string[];
};

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate structured summaries");
  }

  return new OpenAI({ apiKey });
}

export async function generateStructuredSummary(text: string): Promise<StructuredJobSummary> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You extract structured job information.

Return JSON with:
- location
- salaryRange
- companyInfo (array)
- jobDescription (array)
- requirements (array)
- benefits (array)

Rules:
- Be concise
- Use bullet-style phrasing
- If unknown, return null or []
`
      },
      {
        role: "user",
        content: text
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content!);
}
