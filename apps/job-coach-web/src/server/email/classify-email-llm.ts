import { execFileSync } from "node:child_process";
import OpenAI from "openai";

type Status = "applied" | "rejected" | "interviewing" | null;

export async function classifyEmailLLM(input: {
  subject: string;
  snippet: string;
}): Promise<{ status: Status; confidence: number }> {
  let apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    try {
      apiKey = execFileSync("security", ["find-generic-password", "-s", "OPENAI_API_KEY", "-w"], {
        encoding: "utf8",
      }).trim();
    } catch {
      return { status: null, confidence: 0 };
    }
  }

  try {
    const client = new OpenAI({ apiKey });

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `Classify this job-search email.

Return JSON exactly like:
{ "status": "applied" | "rejected" | "interviewing" | "none", "confidence": 0.0 }

Subject: ${input.subject}
Snippet: ${input.snippet}`,
        },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");

    return {
      status: parsed.status === "none" ? null : parsed.status,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    };
  } catch {
    return { status: null, confidence: 0 };
  }
}
