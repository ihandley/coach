import { createApplicationAnswer } from "@coach/core";

interface ApplicationAnswerBody {
  question: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  jobSummary: string;
  resumeSummary: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBody(value: unknown): ApplicationAnswerBody | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Record<string, unknown>;

  if (
    !isNonEmptyString(body.question) ||
    !isNonEmptyString(body.candidateName) ||
    !isNonEmptyString(body.companyName) ||
    !isNonEmptyString(body.jobTitle) ||
    !isNonEmptyString(body.jobSummary) ||
    !isNonEmptyString(body.resumeSummary)
  ) {
    return null;
  }

  return {
    question: body.question,
    candidateName: body.candidateName,
    companyName: body.companyName,
    jobTitle: body.jobTitle,
    jobSummary: body.jobSummary,
    resumeSummary: body.resumeSummary,
  };
}

export async function POST(
  request: Request,
  _context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const json = await request.json().catch(() => null);
  const body = parseBody(json);

  if (!body) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await createApplicationAnswer(body);

  return Response.json(result, { status: 201 });
}
