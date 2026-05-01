import OpenAI from "openai";
type StructuredJobSummary = {
  location: string | null;
  salaryRange: string | null;
  companyInfo: string[];
  jobDescription: string[];
  requirements: string[];
  benefits: string[];
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateStructuredSummary(text: string): Promise<StructuredJobSummary> {
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
