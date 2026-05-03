import OpenAI from "openai";

export type EmailStatus = "applied" | "rejected" | "interviewing" | "none";

export interface LLMClassificationResult {
  status: EmailStatus;
  confidence: number;
}

const CONFIDENCE_THRESHOLD = 0.7;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function isValidStatus(value: any): value is EmailStatus {
  return ["applied", "rejected", "interviewing", "none"].includes(value);
}

export async function classifyEmailLLM(input: {
  subject: string;
  snippet: string;
}): Promise<LLMClassificationResult> {
  const prompt = `
You are classifying job-related emails.

Return JSON:
{
  "status": "applied" | "rejected" | "interviewing" | "none",
  "confidence": number between 0 and 1
}

Rules:
- "rejected" → any rejection, even indirect
- "interviewing" → interview requests, scheduling, next steps
- "applied" → confirmation of application received
- "none" → everything else

Email:
Subject: ${input.subject}
Snippet: ${input.snippet}
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from LLM");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Failed to parse LLM JSON");
    }

    if (!isValidStatus(parsed.status)) {
      throw new Error("Invalid status from LLM");
    }

    if (typeof parsed.confidence !== "number" || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error("Invalid confidence from LLM");
    }

    return {
      status: parsed.status,
      confidence: parsed.confidence,
    };
  } catch (error) {
    throw error;
  }
}

export function isAboveConfidenceThreshold(result: LLMClassificationResult): boolean {
  return result.confidence >= CONFIDENCE_THRESHOLD;
}
